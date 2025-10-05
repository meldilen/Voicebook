FROM golang:1.23-alpine AS builder
WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN go build -o go_api cmd/api/main.go

FROM alpine:3.22
RUN apk update && apk upgrade && apk add --no-cache ca-certificates curl
WORKDIR /root/

COPY --from=builder /app/go_api .
COPY --from=builder /app/certs/ .
