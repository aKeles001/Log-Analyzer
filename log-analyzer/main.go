package main

import (
	"embed"
	_ "embed"
	"fmt"
	"log"
	"time"

	// Import the engine package
	"log-analyzer/internal/models"
	"log-analyzer/internal/parser"
	"log-analyzer/internal/reader"

	"github.com/hpcloud/tail"
	"github.com/wailsapp/wails/v3/pkg/application"
)

var assets embed.FS

func init() {
	application.RegisterEvent[string]("time")
}
func main() {
	app := application.New(application.Options{
		Name:        "log-analyzer",
		Description: "A demo of using raw HTML & CSS",
		Services:    []application.Service{},
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},
	})

	app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title: "Log-Analyzer",
		Mac: application.MacWindow{
			InvisibleTitleBarHeight: 50,
			Backdrop:                application.MacBackdropTranslucent,
			TitleBar:                application.MacTitleBarHiddenInset,
		},
		BackgroundColour: application.NewRGB(27, 38, 54),
		URL:              "/",
	})

	auth := "/var/log/host/auth.log"
	syslog := "/var/log/host/syslog"
	//nginx := "/var/log/host/nginx/access.log"
	ufw := "/var/log/host/ufw.log"
	logs := []string{
		auth,
		syslog,
		//nginx,
		ufw,
	}
	rules, err := reader.LoadRules()
	if err != nil {
		log.Fatalf("Failed to load rules: %v", err)
	}

	for _, logFile := range logs {
		go monitorLog(app, logFile, rules)
	}
	err = app.Run()
	if err != nil {
		log.Fatal(err)
	}
}

func monitorLog(app *application.App, path string, rules []reader.Rule) {
	p, err := parser.NewLogParser("", path)
	if err != nil {
		fmt.Printf("Failed to init parser for %s: %v\n", path, err)
		return
	}

	t, err := tail.TailFile(path, tail.Config{
		Follow: true,
		ReOpen: true,
		Poll:   true,
	})
	if err != nil {
		fmt.Println("Error opening log file:", err)
		return
	}

	var batch []models.Log
	ticker := time.NewTicker(100 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case line, ok := <-t.Lines:
			if !ok {
				return
			}
			if line.Text == "" {
				continue
			}
			parsed, err := p.Parse(line.Text, path)
			if err != nil {
				fmt.Printf("Failed to parse line: %v\n", err)
				continue
			}
			if err == nil {
				batch = append(batch, parsed)
			}
			if len(batch) >= 100 {
				app.Event.Emit("batchLog", batch)
				batch = nil
			}

		case <-ticker.C:
			if len(batch) > 0 {
				app.Event.Emit("batchLog", batch)
				batch = nil
			}
		}
	}
}
