//go:build aix || darwin || dragonfly || freebsd || linux || netbsd || openbsd || solaris

package worker

import (
	"os"
	"os/exec"
	"syscall"
)

func configureWorkerProcess(cmd *exec.Cmd) {
	cmd.Cancel = func() error {
		if cmd.Process == nil {
			return os.ErrProcessDone
		}
		err := cmd.Process.Signal(syscall.SIGTERM)
		if err != nil && errorsIsProcessDone(err) {
			return os.ErrProcessDone
		}
		return err
	}
}

func errorsIsProcessDone(err error) bool {
	return err == os.ErrProcessDone || err == syscall.ESRCH
}
