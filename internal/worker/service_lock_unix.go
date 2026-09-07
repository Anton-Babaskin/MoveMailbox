//go:build linux || darwin || freebsd || openbsd || netbsd || dragonfly

package worker

import (
	"golang.org/x/sys/unix"
	"os"
)

func lockServiceFile(path string) (*os.File, error) {
	file, err := os.OpenFile(path, os.O_CREATE|os.O_RDWR, 0600)
	if err != nil {
		return nil, err
	}
	if err := unix.Flock(int(file.Fd()), unix.LOCK_EX|unix.LOCK_NB); err != nil {
		_ = file.Close()
		return nil, err
	}
	return file, nil
}
