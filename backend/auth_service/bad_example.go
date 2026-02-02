package main

import "fmt"

func badCode() {
	var x int = 42
	fmt.Println("This is a bad function")
	_ = x // This will be caught by ineffassign
}

func unusedVariable() {
	var unused string = "this is never used"
	fmt.Println("Hello world")
}

func badNamingConvention() {
	var bad_name string = "should be camelCase"
	fmt.Println(bad_name)
}

func main() {
	fmt.Println("Starting auth service")
	// This comment is not descriptive enough
	badCode()
	unusedVariable()
	badNamingConvention()
}