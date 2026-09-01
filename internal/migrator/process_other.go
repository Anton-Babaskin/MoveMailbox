//go:build !aix && !darwin && !dragonfly && !freebsd && !linux && !netbsd && !openbsd && !solaris && !windows

package migrator

import (
	"os"
	"os/exec"
)

func configureProcess(cmd *exec.Cmd) {
	cmd.Cancel = func() error {
		if cmd.Process == nil {
			return os.ErrProcessDone
		}
		return processAlreadyDone(cmd.Process.Signal(os.Interrupt))
	}
}
