package reader

import (
	"fmt"
	"os"
	"regexp"

	"gopkg.in/yaml.v2"
)

const rulePath = "rules/rules.yaml"

type Rule struct {
	Name            string         `yaml:"name"`
	Pattern         string         `yaml:"pattern"`
	Severity        string         `yaml:"severity"`
	CompiledPattern *regexp.Regexp `yaml:"-"`
}

func LoadRules() ([]Rule, error) {
	data, err := os.ReadFile(rulePath)
	if err != nil {
		return nil, fmt.Errorf("failed to read rules file %s: %w", rulePath, err)
	}

	var rules []Rule
	err = yaml.Unmarshal(data, &rules)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal rules from %s: %w", rulePath, err)
	}

	for i := range rules {
		compiled, err := regexp.Compile(rules[i].Pattern)
		if err != nil {
			return nil, fmt.Errorf("failed to compile regex for rule '%s': %w", rules[i].Name, err)
		}
		rules[i].CompiledPattern = compiled
	}

	return rules, nil
}
