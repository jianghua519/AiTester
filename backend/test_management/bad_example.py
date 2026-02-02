import os
import sys
import json
from typing import List, Dict, Any


def bad_function():
    x = 42
    print("This function has issues")
    return x


def unused_variable():
    unused_var = "This variable is never used"
    print("Hello world")


def bad_naming_convention():
    bad_name = "should be camel_case"
    print(bad_name)


def long_function_name_that_violates_gocyclo_complexity_rules_and_should_be_broken_up_into_smaller_functions():
    print("This function name is way too long")
    print("And this function does too much work")
    print("It should be broken up")
    print("Into smaller functions")
    print("For better readability")
    print("And maintainability")


class BadClassNaming:
    def __init__(self):
        self.private_var = "should be _private_var"
    
    def bad_method(self):
        return "This method should have a better name"


def main():
    print("Starting test management service")
    bad_function()
    unused_variable()
    bad_naming_convention()
    long_function_name_that_violates_gocyclo_complexity_rules_and_should_be_broken_up_into_smaller_functions()
    
    if True:
        print("Unnecessary if statement")
    
    data = {'key': 'value'}
    with open('/tmp/test.json', 'w') as f:
        json.dump(data, f)


if __name__ == "__main__":
    main()