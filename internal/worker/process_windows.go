//go:build windows

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
		return cmd.Process.Kill()
	}
}
