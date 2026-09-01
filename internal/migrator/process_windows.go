//go:build windows

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
		// Windows has no portable SIGTERM equivalent for a detached CLI tool.
		// Kill is the reliable fallback; Cmd.WaitDelay still bounds pipe cleanup.
		return processAlreadyDone(cmd.Process.Kill())
	}
}
