# Makefile репозитория MoveMailbox.
# В репозитории его раньше не было — файл новый, ничего не затирает.
# Сайт собирается в статику и вшивается в бинарь через go:embed,
# поэтому цель web обязана отработать до go build.

WEB_OUT := internal/web/out

.PHONY: web web-dev build clean-web

## web: собрать сайт и положить в internal/web/out для go:embed
web:
	cd web && npm ci && npm run export

## web-dev: дев-сервер сайта на :3000, API берётся с бекенда на :8080
web-dev:
	cd web && npm run dev

## build: бинарь с уже вшитым сайтом
build: web
	go build -o bin/movemailbox ./cmd/mailbox-migrator

clean-web:
	rm -rf $(WEB_OUT) web/out web/.next
