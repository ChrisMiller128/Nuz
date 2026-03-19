#!/usr/bin/env bash
############################################################################
# Nuzlocke Hub — Production Deployment Script
# Target: Debian 13 (Trixie) with existing services
# Domain: nuzlocke.emulator.st
#
# ARCHITECTURE NOTES:
# -------------------
# This script deploys a full-stack Nuzlocke Hub application consisting of:
#
#   1. Next.js 15 (App Router, TypeScript) — frontend + API backend
#   2. PostgreSQL 16 — relational database via Docker
#   3. Prisma ORM — schema management and queries
#   4. Docker + Docker Compose — container orchestration
#   5. Nginx — reverse proxy with SSL termination
#   6. Certbot — automated Let's Encrypt SSL certificates
#
# APPLICATION DESIGN:
# -------------------
# - Browser-based emulators (EmulatorJS / RetroArch WASM) for GB/GBC/GBA/NDS
# - Nuzlocke ROM generator service with seed-based reproducibility
# - Generated ROMs are PERSISTED as first-class durable assets per user
# - Server-side save files linked to user/run/generatedRom
# - Cross-device resume via server-stored saves
# - Full Nuzlocke tracker: party, box, graveyard, encounters, badges, journal
# - Retro-themed UI with dark mode, pixel accents, and arcade-card styling
#
# REFERENCE PROJECTS (used for conceptual inspiration, not copied):
# - https://github.com/topics/nuzlocke
# - https://github.com/emzinnia/nuzlocke-generator
# - https://github.com/Ajarmar/universal-pokemon-randomizer-zx
#
# The generator service architecture supports future integration with
# real Pokémon randomizer tools (e.g. Universal Pokemon Randomizer ZX)
# via subprocess or WASM module. The first-pass implementation creates
# real generated ROM artifacts with seeded deterministic modifications.
#
# STORAGE LAYOUT:
# /opt/nuzlocke-hub/storage/base-roms/       — platform-managed base ROM files
# /opt/nuzlocke-hub/storage/generated-roms/   — per-user generated ROM artifacts
# /opt/nuzlocke-hub/storage/saves/            — per-user save state files
# /opt/nuzlocke-hub/storage/screenshots/      — optional save screenshots
# /opt/nuzlocke-hub/storage/tmp/              — temporary processing files
#
# DATA MODELS (Prisma):
# User, Game, BaseRom, GeneratedRom, GeneratorProfile,
# Run, SaveState, Encounter, PokemonEntry, BadgeProgress,
# RunNote, DeviceSession
#
# GENERATED ROM OWNERSHIP:
# Each generated ROM is permanently saved under the owning user's account.
# The GeneratedRom record stores: userId, baseRomId, generatorSettingsJson,
# seed, checksum, storagePath, fileName, fileSize, and timestamps.
# Runs reference their GeneratedRom and never regenerate it on reload.
############################################################################

set -Eeuo pipefail

# ─── Logging Helpers ─────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info()  { echo -e "${BLUE}[INFO]${NC}  $(date '+%H:%M:%S') $*"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}    $(date '+%H:%M:%S') $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $(date '+%H:%M:%S') $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $(date '+%H:%M:%S') $*"; }
log_step()  { echo -e "\n${CYAN}═══════════════════════════════════════════════════${NC}"; echo -e "${CYAN}  $*${NC}"; echo -e "${CYAN}═══════════════════════════════════════════════════${NC}\n"; }

# ─── Configuration ───────────────────────────────────────────────────────
DOMAIN="nuzlocke.emulator.st"
PROJECT_DIR="/opt/nuzlocke-hub"
REPO_URL=""  # Set if you want to clone from a repo instead of copying local files
COMPOSE_PROJECT="nuzlocke"

# Generate secrets if not already set
DB_PASSWORD="${DB_PASSWORD:-$(openssl rand -hex 24)}"
NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-$(openssl rand -hex 32)}"

# ─── Pre-flight Checks ──────────────────────────────────────────────────
log_step "PRE-FLIGHT CHECKS"

if [ "$(id -u)" -ne 0 ]; then
    log_error "This script must be run as root (or with sudo)"
    exit 1
fi

log_info "Detected OS: $(cat /etc/os-release 2>/dev/null | grep PRETTY_NAME | cut -d'"' -f2 || echo 'Unknown')"
log_info "Kernel: $(uname -r)"
log_info "Architecture: $(uname -m)"

# ─── Install System Dependencies ────────────────────────────────────────
log_step "CHECKING / INSTALLING SYSTEM DEPENDENCIES"

install_if_missing() {
    local pkg="$1"
    if dpkg -s "$pkg" &>/dev/null; then
        log_ok "$pkg is already installed"
    else
        log_info "Installing $pkg..."
        apt-get install -y -qq "$pkg" && log_ok "$pkg installed" || log_warn "Failed to install $pkg"
    fi
}

apt-get update -qq

REQUIRED_PKGS=(
    ca-certificates curl wget git gnupg lsb-release
    nginx jq openssl rsync unzip
    python3-certbot-nginx certbot
)

for pkg in "${REQUIRED_PKGS[@]}"; do
    install_if_missing "$pkg"
done

# ─── Install Docker ─────────────────────────────────────────────────────
log_step "CHECKING / INSTALLING DOCKER"

if command -v docker &>/dev/null; then
    log_ok "Docker is already installed: $(docker --version)"
else
    log_info "Installing Docker..."

    install -m 0755 -d /etc/apt/keyrings

    if [ ! -f /etc/apt/keyrings/docker.asc ]; then
        curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
        chmod a+r /etc/apt/keyrings/docker.asc
    fi

    CODENAME=$(. /etc/os-release && echo "${VERSION_CODENAME:-trixie}")
    ARCH=$(dpkg --print-architecture)

    echo "deb [arch=${ARCH} signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian ${CODENAME} stable" \
        > /etc/apt/sources.list.d/docker.list

    apt-get update -qq
    apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin \
        || {
            log_warn "Docker CE install from official repo failed, trying default packages..."
            apt-get install -y -qq docker.io docker-compose || true
        }

    systemctl enable docker 2>/dev/null || true
    systemctl start docker 2>/dev/null || true
    log_ok "Docker installed: $(docker --version 2>/dev/null || echo 'version check failed')"
fi

# ─── Check Docker Compose ───────────────────────────────────────────────
log_step "CHECKING DOCKER COMPOSE"

if docker compose version &>/dev/null; then
    log_ok "Docker Compose plugin available: $(docker compose version)"
    COMPOSE_CMD="docker compose"
elif command -v docker-compose &>/dev/null; then
    log_ok "docker-compose standalone available: $(docker-compose --version)"
    COMPOSE_CMD="docker-compose"
else
    log_info "Installing Docker Compose plugin..."
    apt-get install -y -qq docker-compose-plugin 2>/dev/null || {
        log_warn "Compose plugin install failed, trying standalone..."
        curl -fsSL "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
            -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    }

    if docker compose version &>/dev/null; then
        COMPOSE_CMD="docker compose"
    elif command -v docker-compose &>/dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        log_error "Docker Compose is not available. Please install it manually."
        exit 1
    fi
    log_ok "Docker Compose installed"
fi

# ─── Create Project Directory ────────────────────────────────────────────
log_step "SETTING UP PROJECT DIRECTORY"

if [ -d "$PROJECT_DIR" ]; then
    log_info "Project directory $PROJECT_DIR already exists"
    BACKUP_DIR="${PROJECT_DIR}.backup.$(date +%Y%m%d_%H%M%S)"
    log_info "Creating backup at $BACKUP_DIR"
    cp -a "$PROJECT_DIR" "$BACKUP_DIR"
    log_ok "Backup created"
else
    log_info "Creating project directory at $PROJECT_DIR"
    mkdir -p "$PROJECT_DIR"
fi

# ─── Copy / Clone Application Files ─────────────────────────────────────
log_step "DEPLOYING APPLICATION FILES"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -f "$SCRIPT_DIR/package.json" ] && [ -d "$SCRIPT_DIR/src" ]; then
    log_info "Copying application files from $SCRIPT_DIR..."
    rsync -a --exclude='.git' --exclude='node_modules' --exclude='.next' \
        --exclude='storage/base-roms/*' --exclude='storage/generated-roms/*' \
        --exclude='storage/saves/*' --exclude='storage/screenshots/*' \
        --exclude='storage/tmp/*' \
        "$SCRIPT_DIR/" "$PROJECT_DIR/"
    log_ok "Application files copied"
elif [ -n "$REPO_URL" ]; then
    log_info "Cloning from $REPO_URL..."
    if [ -d "$PROJECT_DIR/.git" ]; then
        cd "$PROJECT_DIR" && git pull origin main
    else
        git clone "$REPO_URL" "$PROJECT_DIR"
    fi
    log_ok "Repository cloned"
else
    log_error "No application source found. Run this script from the project root or set REPO_URL."
    exit 1
fi

cd "$PROJECT_DIR"

# ─── Create Storage Directories ─────────────────────────────────────────
log_info "Ensuring storage directories exist..."
mkdir -p storage/{base-roms,generated-roms,saves,screenshots,tmp}
chmod -R 755 storage/
log_ok "Storage directories ready"

# ─── Generate .env File ─────────────────────────────────────────────────
log_step "CONFIGURING ENVIRONMENT"

ENV_FILE="$PROJECT_DIR/.env"

if [ -f "$ENV_FILE" ]; then
    log_info "Existing .env found, backing up..."
    cp "$ENV_FILE" "${ENV_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
fi

cat > "$ENV_FILE" <<ENVEOF
# Nuzlocke Hub — Environment Configuration
# Generated on $(date -Iseconds)

# Database
DATABASE_URL="postgresql://nuzlocke:${DB_PASSWORD}@db:5432/nuzlocke_hub?schema=public"
DB_PASSWORD="${DB_PASSWORD}"

# NextAuth
NEXTAUTH_URL="https://${DOMAIN}"
NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"

# App
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://${DOMAIN}"
NEXT_PUBLIC_APP_NAME="Nuzlocke Hub"

# Storage paths (inside container)
STORAGE_BASE_ROMS="/app/storage/base-roms"
STORAGE_GENERATED_ROMS="/app/storage/generated-roms"
STORAGE_SAVES="/app/storage/saves"
STORAGE_SCREENSHOTS="/app/storage/screenshots"
STORAGE_TMP="/app/storage/tmp"

# Upload limits (bytes)
MAX_ROM_SIZE="67108864"
MAX_SAVE_SIZE="16777216"

# Rate limiting
RATE_LIMIT_WINDOW_MS="60000"
RATE_LIMIT_MAX_REQUESTS="100"
ENVEOF

chmod 600 "$ENV_FILE"
log_ok "Environment file created at $ENV_FILE"

# ─── Configure Reverse Proxy (Caddy or Nginx) ───────────────────────────
log_step "CONFIGURING REVERSE PROXY"

# Detect what is currently on port 80
PORT80_PID=$(ss -tlnp 'sport = :80' 2>/dev/null | grep -oP 'pid=\K[0-9]+' | head -1 || true)
PORT80_PROC=""
if [ -n "$PORT80_PID" ]; then
    PORT80_PROC=$(ps -p "$PORT80_PID" -o comm= 2>/dev/null || true)
fi

if command -v caddy &>/dev/null || [ "$PORT80_PROC" = "caddy" ]; then
    # ─── Caddy path ─────────────────────────────────────────────────
    log_info "Caddy detected as the active reverse proxy"
    USE_CADDY=true

    CADDYFILE="/etc/caddy/Caddyfile"
    CADDY_SNIPPET="${PROJECT_DIR}/caddy-site.conf"

    # Write the site block for this domain
    cat > "$CADDY_SNIPPET" <<CADDYEOF
${DOMAIN} {
    reverse_proxy 127.0.0.1:3000 {
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }
    request_body {
        max_size 64MB
    }
    header {
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
        Strict-Transport-Security "max-age=63072000"
    }
    @static path /_next/static/*
    header @static Cache-Control "public, max-age=31536000, immutable"
}
CADDYEOF
    log_ok "Caddy site config written to $CADDY_SNIPPET"

    # Check if the domain is already in the Caddyfile
    if [ -f "$CADDYFILE" ]; then
        if grep -q "${DOMAIN}" "$CADDYFILE" 2>/dev/null; then
            log_info "Domain already present in $CADDYFILE — replacing block"
            # Back up before modifying
            cp "$CADDYFILE" "${CADDYFILE}.backup.$(date +%Y%m%d_%H%M%S)"
            # Remove old block (everything between "nuzlocke.emulator.st {" and its closing "}")
            # Use a temp file approach for safety
            python3 -c "
import re, sys
with open('$CADDYFILE') as f:
    content = f.read()
pattern = r'${DOMAIN}\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}\n?'
content = re.sub(pattern, '', content)
with open('$CADDYFILE', 'w') as f:
    f.write(content)
" 2>/dev/null || {
                log_warn "Could not auto-remove old block — appending new one"
            }
        fi
        # Append the new site block
        echo "" >> "$CADDYFILE"
        cat "$CADDY_SNIPPET" >> "$CADDYFILE"
        log_ok "Site block appended to $CADDYFILE"
    else
        log_warn "$CADDYFILE not found — creating it"
        cp "$CADDY_SNIPPET" "$CADDYFILE"
        log_ok "Created $CADDYFILE"
    fi

    # Validate and reload Caddy
    if caddy validate --config "$CADDYFILE" --adapter caddyfile 2>/dev/null; then
        caddy reload --config "$CADDYFILE" --adapter caddyfile 2>/dev/null \
            || systemctl reload caddy 2>/dev/null \
            || systemctl restart caddy 2>/dev/null \
            || true
        log_ok "Caddy configuration reloaded (SSL is automatic)"
    else
        log_warn "Caddy config validation failed — check $CADDYFILE"
        log_warn "You may need to manually add the block from $CADDY_SNIPPET"
    fi

    # Disable nginx for this site if it was previously configured
    if [ -L "/etc/nginx/sites-enabled/${DOMAIN}" ]; then
        rm -f "/etc/nginx/sites-enabled/${DOMAIN}"
        nginx -t 2>/dev/null && systemctl reload nginx 2>/dev/null || true
        log_info "Removed old nginx site config for ${DOMAIN}"
    fi

else
    # ─── Nginx path ─────────────────────────────────────────────────
    USE_CADDY=false
    log_info "Using Nginx as reverse proxy"

    NGINX_CONF="/etc/nginx/sites-available/${DOMAIN}"
    NGINX_LINK="/etc/nginx/sites-enabled/${DOMAIN}"

    if [ -f "$NGINX_CONF" ]; then
        log_info "Backing up existing nginx config..."
        cp "$NGINX_CONF" "${NGINX_CONF}.backup.$(date +%Y%m%d_%H%M%S)"
    fi

    cat > "$NGINX_CONF" <<'NGINXEOF'
server {
    listen 80;
    listen [::]:80;
    server_name nuzlocke.emulator.st;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
        client_max_body_size 64M;
    }

    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
NGINXEOF

    if [ ! -L "$NGINX_LINK" ]; then
        ln -sf "$NGINX_CONF" "$NGINX_LINK"
        log_ok "Nginx site enabled"
    else
        log_ok "Nginx site symlink already exists"
    fi

    if nginx -t 2>/dev/null; then
        systemctl reload nginx 2>/dev/null || systemctl restart nginx 2>/dev/null || true
        log_ok "Nginx configuration valid and reloaded"
    else
        log_warn "Nginx configuration test failed"
    fi

    # ─── SSL Certificate (Nginx only — Caddy handles SSL automatically) ──
    log_step "SSL CERTIFICATE"

    if [ -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
        log_ok "SSL certificate already exists for ${DOMAIN}"
    else
        log_info "Attempting to obtain SSL certificate for ${DOMAIN}..."
        log_info "This requires DNS to be pointing to this server."

        if certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos \
            --register-unsafely-without-email --redirect 2>/dev/null; then
            log_ok "SSL certificate obtained and nginx configured"
        else
            log_warn "SSL certificate request failed."
            log_warn "This is normal if DNS is not yet pointing to this server."
            log_warn "Run manually later: certbot --nginx -d ${DOMAIN}"
        fi
    fi
fi

# ─── Build and Start Services ───────────────────────────────────────────
log_step "BUILDING AND STARTING DOCKER SERVICES"

cd "$PROJECT_DIR"

log_info "Building Docker images (this may take a few minutes on first run)..."
$COMPOSE_CMD build 2>&1 | tail -20
if [ $? -ne 0 ]; then
    log_error "Docker build failed. Check the output above for details."
    exit 1
fi

log_info "Building tools image for migrations and seeding..."
$COMPOSE_CMD --profile migrate build migrate 2>&1 | tail -10

log_info "Starting services..."
$COMPOSE_CMD down 2>/dev/null || true
$COMPOSE_CMD up -d

log_info "Waiting for database to be ready..."
for i in $(seq 1 30); do
    if $COMPOSE_CMD exec -T db pg_isready -U nuzlocke -d nuzlocke_hub &>/dev/null; then
        log_ok "Database is ready"
        break
    fi
    sleep 2
done

# ─── Database Migration and Seeding ─────────────────────────────────────
log_step "DATABASE INITIALIZATION"

log_info "Running database schema push..."
$COMPOSE_CMD --profile migrate run --rm migrate 2>&1 | tail -10 || {
    log_warn "Schema push via migrate service failed, trying direct..."
    $COMPOSE_CMD exec -T app npx prisma db push --accept-data-loss 2>/dev/null || true
}
log_ok "Database schema applied"

log_info "Seeding database with games and demo data..."
$COMPOSE_CMD --profile seed run --rm seed 2>&1 | tail -10 || {
    log_warn "Seed via seed service failed, trying direct..."
    $COMPOSE_CMD exec -T app npx tsx scripts/seed.ts 2>/dev/null || true
}
log_ok "Database seeded"

# ─── Health Check ────────────────────────────────────────────────────────
log_step "HEALTH CHECK"

sleep 5

if curl -sf -o /dev/null http://127.0.0.1:3000; then
    log_ok "Application is responding on port 3000"
else
    log_warn "Application health check failed — it may still be starting up"
    log_info "Check logs with: cd $PROJECT_DIR && $COMPOSE_CMD logs -f app"
fi

if curl -sf -o /dev/null "https://${DOMAIN}" 2>/dev/null; then
    log_ok "Reverse proxy is working for https://${DOMAIN}"
elif curl -sf -o /dev/null "http://${DOMAIN}" 2>/dev/null; then
    log_ok "Reverse proxy is working for http://${DOMAIN} (SSL may still be provisioning)"
else
    log_warn "Reverse proxy check inconclusive (DNS may not be configured yet)"
fi

# ─── Print Status ────────────────────────────────────────────────────────
log_step "DEPLOYMENT COMPLETE"

PROXY_NAME="Nginx"
if [ "${USE_CADDY:-false}" = "true" ]; then
    PROXY_NAME="Caddy (auto-SSL)"
fi

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                  NUZLOCKE HUB — DEPLOYED                    ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║${NC}                                                              ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  ${CYAN}Application URL:${NC}  https://${DOMAIN}              ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  ${CYAN}Direct URL:${NC}       http://127.0.0.1:3000                ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  ${CYAN}Reverse Proxy:${NC}    ${PROXY_NAME}                              ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  ${CYAN}Project Dir:${NC}      ${PROJECT_DIR}                  ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}                                                              ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  ${CYAN}Demo Account:${NC}                                          ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}    Email:    demo@nuzlocke.emulator.st                        ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}    Password: nuzlocke123                                      ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}                                                              ${GREEN}║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║${NC}  ${YELLOW}NEXT STEPS:${NC}                                              ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}                                                              ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  1. Ensure DNS A record for ${DOMAIN}           ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}     points to this server's IP address                       ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}                                                              ${GREEN}║${NC}"
if [ "${USE_CADDY:-false}" = "true" ]; then
echo -e "${GREEN}║${NC}  2. Caddy handles SSL automatically once DNS is live         ${GREEN}║${NC}"
else
echo -e "${GREEN}║${NC}  2. If SSL failed, run after DNS is ready:                   ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}     certbot --nginx -d ${DOMAIN}                ${GREEN}║${NC}"
fi
echo -e "${GREEN}║${NC}                                                              ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  3. Place your own legal ROM files in:                       ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}     ${PROJECT_DIR}/storage/base-roms/             ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}                                                              ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  4. Change the demo account password                         ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}                                                              ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  5. Update DB_PASSWORD and NEXTAUTH_SECRET                   ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}     in ${PROJECT_DIR}/.env for production       ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}                                                              ${GREEN}║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║${NC}  ${CYAN}USEFUL COMMANDS:${NC}                                         ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}                                                              ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  View logs:     cd ${PROJECT_DIR} && $COMPOSE_CMD logs -f  ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  Restart:       cd ${PROJECT_DIR} && $COMPOSE_CMD restart  ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  Stop:          cd ${PROJECT_DIR} && $COMPOSE_CMD down     ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  Rebuild:       cd ${PROJECT_DIR} && $COMPOSE_CMD up -d --build ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  DB Studio:     cd ${PROJECT_DIR} && $COMPOSE_CMD exec app npx prisma studio ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}                                                              ${GREEN}║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

log_ok "Deployment script finished successfully"
