# Use Ubuntu 24.04 as your base
FROM ubuntu:24.04

# Environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV GO_VERSION=1.25.6
ENV PATH="/usr/local/go/bin:/home/wailsdev/go/bin:${PATH}"

# 1. Install System Dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    pkg-config \
    git \
    wget \
    curl \
    libgtk-3-dev \
    libwebkit2gtk-4.1-dev \
    libnss3 \
    libatk1.0-dev \
    libatk-bridge2.0-dev \
    libcups2 \
    libdrm2 \
    libxkbcommon-dev \
    libxcomposite-dev \
    libxdamage-dev \
    libxrandr-dev \
    libgbm-dev \
    libasound2-dev \
    dbus-x11 \
    libcanberra-gtk-module \
    libcanberra-gtk3-module \
    && rm -rf /var/lib/apt/lists/*
# 2. Install Go 1.24+ (Required for v3)
RUN wget -q https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz \
    && tar -C /usr/local -xzf go${GO_VERSION}.linux-amd64.tar.gz \
    && rm go${GO_VERSION}.linux-amd64.tar.gz

# 3. Install Node.js (LTS)
RUN curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - \
    && apt-get install -y nodejs

WORKDIR /app

# 4. Create non-root user (UID 1000 for local file permission sync)
RUN if id 1000 >/dev/null 2>&1; then \
        userdel -r $(id -un 1000) 2>/dev/null || true; \
    fi && \
    useradd -m -s /bin/bash -u 1000 wailsdev && \
    usermod -aG adm wailsdev && \
    echo "Created user wailsdev with UID 1000" && \
    chown -R wailsdev:wailsdev /app
USER wailsdev

# Set Go environment for wailsdev user
ENV GOPATH=/home/wailsdev/go
ENV PATH=$GOPATH/bin:/usr/local/go/bin:$PATH

# Create Go directories
RUN mkdir -p $GOPATH/bin $GOPATH/pkg $GOPATH/src

# Install Wails CLI
RUN go install github.com/wailsapp/wails/v3/cmd/wails3@latest

# Switch back to root
USER root

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
# RUN chmod 666 /var/log/host
RUN usermod -aG sudo wailsdev
# RUN xhost +local:docker
USER wailsdev


ENTRYPOINT ["/entrypoint.sh"]
CMD ["bash"]