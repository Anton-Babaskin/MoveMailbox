//go:build !windows && !linux && !darwin && !freebsd && !openbsd && !netbsd && !dragonfly

package worker

import (
	"errors"
	"os"
)

func lockServiceFile(string) (*os.File, error) {
	return nil, errors.New("worker service file locking is unsupported on this platform")
}
