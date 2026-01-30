package parser

import (
	"fmt"
	"regexp"
	"strings"
	"time"

	"log-analyzer/internal/engine"
	"log-analyzer/internal/models"
)

type logParser interface {
	Parse(line string, logPath string) (models.Log, error)
}

type AuthLogParser struct {
}

func (p *AuthLogParser) Parse(line string, logPath string) (models.Log, error) {
	regexes := []struct {
		re *regexp.Regexp
	}{
		{
			//With PID part
			re: regexp.MustCompile(`^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+[+-]\d{2}:\d{2})\s+(\S+)\s+(\S+?)(?:\[(\d+)\])?:\s+(.+)$`),
		},
		{
			//Without PID part
			re: regexp.MustCompile(`^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+)\s+(\S+)\s+(\S+?)(?:\[(\d+)\])?:\s+(.+)$`),
		},
	}

	for _, item := range regexes {
		matches := item.re.FindStringSubmatch(line)
		if matches != nil {
			t, err := time.Parse(time.RFC3339Nano, matches[1])
			if err != nil {
				return models.Log{}, fmt.Errorf("failed to parse timestamp: %w", err)
			}

			hostname := matches[2]
			program := matches[3]
			pid := matches[4]
			message := matches[5]
			source := program

			if pid != "" {
				source = fmt.Sprintf("%s[%s]", program, pid)
			}
			source = fmt.Sprintf("%s/%s", hostname, source)
			model := models.Log{
				Timestamp: t,
				Level:     "INFO",
				Source:    source,
				Message:   message,
				LogFile:   logPath,
				Raw:       line,
			}
			model, err = engine.Evaluate(model)
			return model, err
		}
	}
	return models.Log{}, fmt.Errorf("auth.log parser: line did not match any expected format: %s", line)
}

type SyslogParser struct {
}

func (p *SyslogParser) Parse(line string, logPath string) (models.Log, error) {
	regexes := []struct {
		re      *regexp.Regexp
		timeFmt string
	}{
		{
			regexp.MustCompile(`^([^\s]+)\s+([\w\d\.-]+)\s+([^:]+):\s+(.*)$`),
			"rfc3339",
		},
		{
			regexp.MustCompile(`^([A-Z][a-z]{2}\s+\d+\s\d{2}:\d{2}:\d{2})\s+([^\s]+)\s+([^:]+):\s+(.*)$`),
			"legacy",
		},
	}

	for _, item := range regexes {
		matches := item.re.FindStringSubmatch(line)
		if len(matches) >= 5 {
			var t time.Time
			var err error
			var source, message string

			if item.timeFmt == "rfc3339" {
				t, err = time.Parse(time.RFC3339Nano, matches[1])
				if err != nil {
					t, err = time.Parse(time.RFC3339, matches[1])
				}
				source = matches[3]
				message = strings.TrimSpace(matches[4])
			} else if item.timeFmt == "legacy" {
				currentYear := time.Now().Year()
				timeStr := fmt.Sprintf("%d %s", currentYear, matches[1])
				t, err = time.Parse("2006 Jan _2 15:04:05", timeStr)
				source = matches[3]
				message = strings.TrimSpace(matches[4])
			}
			if err == nil {
				model := models.Log{
					Timestamp: t,
					Level:     "INFO",
					Source:    source,
					Message:   message,
					LogFile:   logPath,
					Raw:       line,
				}
				model, err = engine.Evaluate(model)
				return model, nil
			}
		}
	}
	return models.Log{}, fmt.Errorf("syslog parser: line did not match any expected format: %s", line)
}

type UfwLogParser struct {
}

func (p *UfwLogParser) Parse(line string, logPath string) (models.Log, error) {
	headerRegex := regexp.MustCompile(`^([\d-T:+. ]+)\s+([^\s]+)\s+kernel:\s+\[UFW\s+([^\]]+)\]\s+(.*)$`)

	headerMatches := headerRegex.FindStringSubmatch(line)
	if len(headerMatches) < 5 {
		return models.Log{}, fmt.Errorf("ufw.log parser: header mismatch: %s", line)
	}

	timestampRaw := headerMatches[1]
	host := headerMatches[2]
	action := headerMatches[3]
	body := headerMatches[4]

	t, err := time.Parse(time.RFC3339, timestampRaw)
	if err != nil {
		t, _ = time.Parse("Jan _2 15:04:05", timestampRaw)
	}

	extract := func(key string) string {
		re := regexp.MustCompile(key + `=([^\s]+)`)
		m := re.FindStringSubmatch(body)
		if len(m) > 1 {
			return m[1]
		}
		return "N/A"
	}

	srcIP := extract("SRC")
	dstIP := extract("DST")
	proto := extract("PROTO")
	spt := extract("SPT")
	dpt := extract("DPT")
	level := "INFO"
	if action == "BLOCK" {
		level = "HIGH"
	}
	model := models.Log{
		Timestamp: t,
		Level:     level,
		Source:    fmt.Sprintf("%s", host),
		Message:   fmt.Sprintf("Action: %s --- %s -> %s [%s] SPT:%s DPT:%s", action, srcIP, dstIP, proto, spt, dpt),
		LogFile:   logPath,
		Raw:       line,
	}
	model, err = engine.Evaluate(model)
	return model, nil
}

func NewLogParser(line string, logPath string) (logParser, error) {
	switch logPath {
	case "/var/log/host/auth.log":
		return &AuthLogParser{}, nil
	case "/var/log/host/syslog":
		return &SyslogParser{}, nil
	case "/var/log/host/nginx/access.log":
		//return &NginxLogParser{}, nil
	case "/var/log/host/ufw.log":
		return &UfwLogParser{}, nil
	}
	return nil, fmt.Errorf("Could not determine a parser.")
}
