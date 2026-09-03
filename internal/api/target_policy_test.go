package api

import (
	"context"
	"net"
	"testing"
)

type fixedResolver struct {
	addresses []net.IPAddr
	err       error
}

func (resolver fixedResolver) LookupIPAddr(context.Context, string) ([]net.IPAddr, error) {
	return resolver.addresses, resolver.err
}

func TestEndpointTargetPolicyAllowsPublicIMAPAndRejectsInternalTargets(t *testing.T) {
	policy := newEndpointTargetPolicy([]int{143, 993})
	for _, target := range []struct {
		host string
		port int
	}{
		{host: "8.8.8.8", port: 993},
		{host: "2606:4700:4700::1111", port: 143},
	} {
		if err := policy.validate(context.Background(), target.host, target.port); err != nil {
			t.Errorf("public target %s:%d rejected: %v", target.host, target.port, err)
		}
	}

	for _, target := range []struct {
		host string
		port int
	}{
		{host: "127.0.0.1", port: 993},
		{host: "10.0.0.1", port: 993},
		{host: "100.64.0.1", port: 993},
		{host: "169.254.169.254", port: 993},
		{host: "192.0.2.1", port: 993},
		{host: "8.8.8.8", port: 22},
		{host: "::1", port: 993},
		{host: "fd00::1", port: 993},
		{host: "2001:db8::1", port: 993},
	} {
		if err := policy.validate(context.Background(), target.host, target.port); err == nil {
			t.Errorf("internal/reserved target %s:%d was accepted", target.host, target.port)
		}
	}
}

func TestEndpointTargetPolicyRejectsHostnameIfAnyAddressIsPrivate(t *testing.T) {
	policy := newEndpointTargetPolicy([]int{993})
	policy.resolver = fixedResolver{addresses: []net.IPAddr{
		{IP: net.ParseIP("8.8.8.8")},
		{IP: net.ParseIP("10.0.0.2")},
	}}
	if err := policy.validate(context.Background(), "imap.example", 993); err == nil {
		t.Fatal("hostname with a private DNS answer was accepted")
	}
}
