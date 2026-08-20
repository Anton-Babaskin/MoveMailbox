package webui

import "embed"

// Assets contains the production web interface served by the Go application.
//
//go:embed dist/*
var Assets embed.FS
