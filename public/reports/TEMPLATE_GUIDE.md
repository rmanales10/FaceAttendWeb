# DOCX Template Guide

## How to Add Placeholders to Your Template

To use the template with the Reports feature, you need to add placeholders to your DOCX file. Open the file in Microsoft Word and add these placeholders where you want the data to appear:

### Basic Placeholders

Replace the static text in your template with these placeholders:

- **Subject**: `{subject}`
- **Course Code**: `{course_code}`
- **Class Schedule**: `{schedule}`
- **Building and Room No.**: `{building_room}`
- **Date**: `{date}`
- **Teacher**: `{teacher}`
- **Department**: `{department}`
- **Course & Year**: `{course_year}`

### Summary Placeholders

- **Total Students**: `{total_students}`
- **Present Count**: `{present_count}`
- **Absent Count**: `{absent_count}`

### Student Table (Repeating Rows)

For the student table, you need to add a loop. In your table, create one row that will be repeated for each student:

```
┌────┬──────────────────┬─────────────┬────────────┐
│ No.│ Name of Student  │ Course &Year│ Attendance │
├────┼──────────────────┼─────────────┼────────────┤
│{#students}                                        │
│{no}│ {name}           │ {course_year}│{attendance}│
│{/students}                                        │
└────┴──────────────────┴─────────────┴────────────┘
```

**Important**: 
- Put `{#students}` at the START of the repeating row
- Put `{/students}` at the END of the repeating row
- Between them, use `{no}`, `{name}`, `{course_year}`, and `{attendance}`

## Example Template Structure

Your document should look something like this:

```
ATTENDANCE MONITORING SHEET

Subject: {subject}
Course Code: {course_code}
Class Schedule: {schedule}
Bldg. and Room No.: {building_room}
Date: {date}
Teacher: {teacher}
Department: {department}

┌────────────────────────────────────────────────┐
│ No. │ Name of Student │ Course & Year │ ✓/X   │
├─────┼─────────────────┼───────────────┼───────┤
│{#students}                                     │
│ {no}│ {name}          │ {course_year} │{attendance}│
│{/students}                                     │
└─────┴─────────────────┴───────────────┴───────┘

Total Students: {total_students}
Present: {present_count}
Absent: {absent_count}
```

## Testing Your Template

1. Save your template with the placeholders added
2. Upload it to `/public/reports/FM-USTP-ACAD-06-Attendance-and-Punctuality-Monitoring-Sheet.docx`
3. Try generating a report from the Reports page
4. The placeholders will be replaced with actual attendance data

## Troubleshooting

- **Template not loading?** Make sure the file is in `/public/reports/` folder
- **Placeholders not replacing?** Check that curly braces are correct: `{placeholder}` not `[placeholder]` or `(placeholder)`
- **Table not repeating?** Ensure `{#students}` and `   ` are in the same table, wrapping one complete row
- **Special characters?** Use simple ASCII characters, avoid fancy quotes or symbols

## Data Fields Reference

All available fields:
- `{subject}` - Subject name (e.g., "IT Elective 3")
- `{course_code}` - Course code (e.g., "IT223")  
- `{schedule}` - Class schedule (e.g., "Mon 3:43 PM - 5:43 PM")
- `{building_room}` - Building and room (e.g., "MSC 03")
- `{date}` - Attendance date (e.g., "October 28, 2025")
- `{teacher}` - Teacher name
- `{department}` - Department
- `{course_year}` - Course and year (e.g., "BSIT 4D")
- `{total_students}` - Total number of students
- `{present_count}` - Number of present students
- `{absent_count}` - Number of absent students

For each student in the loop:
- `{no}` - Student number (1, 2, 3...)
- `{name}` - Student name
- `{course_year}` - Student's course and year
- `{attendance}` - ✓ for present, X for absent

