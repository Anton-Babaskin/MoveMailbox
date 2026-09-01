//go:build aix || darwin || dragonfly || freebsd || linux || netbsd || openbsd || solaris

package migrator

import (
	"os"
	"os/exec"
	"syscall"
)

func configureProcess(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}
	cmd.Cancel = func() error {
		if cmd.Process == nil {
			return os.ErrProcessDone
		}
		// imapsync may launch helpers. Signal the whole process group so they do
		// not keep stdout/stderr pipes open after cancellation.
		return processAlreadyDone(syscall.Kill(-cmd.Process.Pid, syscall.SIGTERM))
	}
}
