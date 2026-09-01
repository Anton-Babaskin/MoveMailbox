package migrator

import (
	"context"
	"testing"
)

func TestDemoEngineMigratesEveryAdvertisedFolder(t *testing.T) {
	engine := DemoEngine{}
	folders, err := engine.ListFolders(context.Background(), Endpoint{})
	if err != nil {
		t.Fatal(err)
	}

	for _, folder := range folders {
		request := testRequest()
		request.Options.Folders = []string{folder.Name}
		result, err := engine.Migrate(context.Background(), request, func(Event) {})
		if err != nil {
			t.Fatalf("folder %q failed: %v", folder.Name, err)
		}
		if result.Transferred == 0 {
			t.Errorf("folder %q is advertised but transfers no demo messages", folder.Name)
		}
	}
}
