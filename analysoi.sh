#!/bin/bash

echo "=== Repository Analysis ===" | tee analysis_report.txt
echo "" | tee -a analysis_report.txt

echo "Detected languages:" | tee -a analysis_report.txt

if find . -type f -name "*.py" | grep -q .; then
  echo "- Python" | tee -a analysis_report.txt
fi

if find . -type f -name "*.js" | grep -q .; then
  echo "- JavaScript" | tee -a analysis_report.txt
fi

if find . -type f -name "*.ts" | grep -q .; then
  echo "- TypeScript" | tee -a analysis_report.txt
fi

if find . -type f -name "*.java" | grep -q .; then
  echo "- Java" | tee -a analysis_report.txt
fi

echo "" | tee -a analysis_report.txt

echo "Design patterns detected:" | tee -a analysis_report.txt

grep -R "getInstance" . > /dev/null && echo "- Singleton" | tee -a analysis_report.txt
grep -R "create[A-Z]" . > /dev/null && echo "- Factory Method" | tee -a analysis_report.txt
grep -R "Strategy" . > /dev/null && echo "- Strategy" | tee -a analysis_report.txt
grep -R "notify" . > /dev/null && echo "- Observer" | tee -a analysis_report.txt
grep -R "Decorator" . > /dev/null && echo "- Decorator" | tee -a analysis_report.txt

echo "" | tee -a analysis_report.txt
echo "Analysis complete."
