//go:build !aix && !darwin && !dragonfly && !freebsd && !linux && !netbsd && !openbsd && !solaris && !windows

package worker

import (
	"os"
	"os/exec"
)

func configureWorkerProcess(cmd *exec.Cmd) {
	cmd.Cancel = func() error {
		if cmd.Process == nil {
			return os.ErrProcessDone
		}
		return cmd.Process.Signal(os.Interrupt)
	}
}
