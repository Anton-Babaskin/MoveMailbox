package api

import (
	"context"
	"errors"
	"net"
	"net/netip"
	"strings"
)

var errPublicTargetDenied = errors.New("public mode permits only publicly routed IMAP endpoints on approved ports")

var reservedPublicPrefixes = []netip.Prefix{
	netip.MustParsePrefix("100.64.0.0/10"),
	netip.MustParsePrefix("192.0.0.0/24"),
	netip.MustParsePrefix("192.0.2.0/24"),
	netip.MustParsePrefix("198.18.0.0/15"),
	netip.MustParsePrefix("198.51.100.0/24"),
	netip.MustParsePrefix("203.0.113.0/24"),
	netip.MustParsePrefix("240.0.0.0/4"),
	netip.MustParsePrefix("64:ff9b:1::/48"),
	netip.MustParsePrefix("2001:2::/48"),
	netip.MustParsePrefix("2001:db8::/32"),
}

type endpointTargetPolicy struct {
	ports    map[int]struct{}
	resolver interface {
		LookupIPAddr(context.Context, string) ([]net.IPAddr, error)
	}
}

func newEndpointTargetPolicy(ports []int) endpointTargetPolicy {
	allowed := make(map[int]struct{}, len(ports))
	for _, port := range ports {
		allowed[port] = struct{}{}
	}
	return endpointTargetPolicy{ports: allowed, resolver: net.DefaultResolver}
}

func (policy endpointTargetPolicy) validate(ctx context.Context, host string, port int) error {
	if _, ok := policy.ports[port]; !ok {
		return errPublicTargetDenied
	}
	host = strings.Trim(strings.TrimSpace(host), "[]")
	if address, err := netip.ParseAddr(host); err == nil {
		if !publiclyRoutable(address) {
			return errPublicTargetDenied
		}
		return nil
	}
	addresses, err := policy.resolver.LookupIPAddr(ctx, host)
	if err != nil || len(addresses) == 0 {
		return errPublicTargetDenied
	}
	for _, resolved := range addresses {
		address, ok := netip.AddrFromSlice(resolved.IP)
		if !ok || !publiclyRoutable(address) {
			return errPublicTargetDenied
		}
	}
	return nil
}

func publiclyRoutable(address netip.Addr) bool {
	address = address.Unmap()
	if !address.IsValid() || !address.IsGlobalUnicast() || address.IsPrivate() || address.IsLoopback() || address.IsLinkLocalUnicast() || address.IsUnspecified() {
		return false
	}
	for _, prefix := range reservedPublicPrefixes {
		if prefix.Contains(address) {
			return false
		}
	}
	return true
}
