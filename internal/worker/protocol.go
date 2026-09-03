package worker

import "github.com/Anton-Babaskin/MoveMailbox/internal/migrator"

const (
	messageEvent   = "event"
	messageResult  = "result"
	messageFolders = "folders"
	messageError   = "error"
)

type protocolMessage struct {
	Type    string            `json:"type"`
	Event   *migrator.Event   `json:"event,omitempty"`
	Result  *migrator.Result  `json:"result,omitempty"`
	Folders []migrator.Folder `json:"folders,omitempty"`
	Error   string            `json:"error,omitempty"`
}
