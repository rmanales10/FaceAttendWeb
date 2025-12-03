# Multiple Dates Template Guide

## Overview

This guide explains how to modify your Word template to support **multiple date columns** (up to 10 dates) for the complete attendance report.

## Current vs. New Structure

### Current Template (Single Date)
```
┌────┬──────────────────┬─────────────┬────────────┐
│ No.│ Name of Student  │ Course &Year│ Attendance │
├────┼──────────────────┼─────────────┼────────────┤
│{#students}                                        │
│{no}│ {name}           │ {course_year}│{attendance}│
│{/students}                                        │
└────┴──────────────────┴─────────────┴────────────┘
```

### New Template (Multiple Dates - Up to 10)
```
┌────┬──────────────────┬─────────────┬──────┬──────┬──────┬──────┐
│ No.│ Name of Student  │ Course &Year│{date1}│{date2}│{date3}│ ... │
├────┼──────────────────┼─────────────┼──────┼──────┼──────┼──────┤
│{#students}                                                      │
│{no}│ {name}           │ {course_year}│{attendance1}│{attendance2}│{attendance3}│ ... │
│{/students}                                                      │
└────┴──────────────────┴─────────────┴──────┴──────┴──────┴──────┘
```

## Step-by-Step Instructions

### Step 1: Update the Table Header

1. Open your template in Microsoft Word
2. Find the table header row (the row with column titles)
3. Replace the single "Attendance" column with multiple date columns:
   - Keep: `No.`, `Name of Student`, `Course & Year`
   - Replace: `Attendance` with `{date1}`, `{date2}`, `{date3}`, etc. (up to `{date10}`)

**Example Header Row:**
```
| No. | Name of Student | Course & Year | {date1} | {date2} | {date3} | {date4} | {date5} | {date6} | {date7} | {date8} | {date9} | {date10} |
```

**Note:** 
- Header row uses `{date1}`, `{date2}`, etc. to show the actual dates
- Student row uses `{attendance1}`, `{attendance2}`, etc. to show attendance symbols
- The API will only populate dates that exist (up to 10). If you have fewer dates, the extra columns will show empty.

### Step 2: Update the Student Data Row

1. Find the row inside the `{#students}...{/students}` loop
2. Replace the single `{attendance}` cell with multiple attendance cells
3. Each cell should reference the attendance property: `{attendance1}`, `{attendance2}`, etc.

**Example Student Row:**
```
{#students}
| {no} | {name} | {course_year} | {attendance1} | {attendance2} | {attendance3} | {attendance4} | {attendance5} | {attendance6} | {attendance7} | {attendance8} | {attendance9} | {attendance10} |
{/students}
```

### Step 3: How the Data Works

The API sends data in this format:

```javascript
{
  subject: "IT413 Social and Professional Issues",
  course_code: "IT413",
  // ... other fields ...
  date1: "November 28, 2025",
  date2: "November 25, 2025",
  date3: "November 22, 2025",
  // ... up to date10 ...
  students: [
    {
      no: "1",
      name: "John Doe",
      course_year: "BSIT 4D",
      attendance1: "✓",  // Present on date1
      attendance2: "X",  // Absent on date2
      attendance3: "L",  // Late on date3
      attendance4: "E",  // Excuse on date4
      // ... attendance for each date ...
    },
    // ... more students ...
  ]
}
```

**Attendance Symbols:**
- `✓` = Present (checkmark)
- `L` = Late
- `X` = Absent
- `E` = Excuse
- Empty = No attendance record for that date

### Step 4: Complete Template Example

Here's what your complete template structure should look like:

```
ATTENDANCE AND PUNCTUALITY MONITORING SHEET

Office / Unit: {department}
Subject: {subject}
Course Code: {course_code}
Class Schedule: {schedule}
Bldg. and Room No.: {building_room}

┌────┬──────────────────┬─────────────┬────────────┬────────────┬────────────┬────────────┬────────────┬────────────┬────────────┬────────────┬────────────┬────────────┐
│ No.│ Name of Student  │ Course &Year│ {date1}    │ {date2}    │ {date3}    │ {date4}    │ {date5}    │ {date6}    │ {date7}    │ {date8}    │ {date9}    │ {date10}   │
├────┼──────────────────┼─────────────┼────────────┼────────────┼────────────┼────────────┼────────────┼────────────┼────────────┼────────────┼────────────┼────────────┤
│{#students}                                                                                                                                                          │
│ {no}│ {name}           │ {course_year}│ {attendance1}│ {attendance2}│ {attendance3}│ {attendance4}│ {attendance5}│ {attendance6}│ {attendance7}│ {attendance8}│ {attendance9}│ {attendance10}│
│{/students}                                                                                                                                                          │
└────┴──────────────────┴─────────────┴────────────┴────────────┴────────────┴────────────┴────────────┴────────────┴────────────┴────────────┴────────────┴────────────┘

Total Students: {total_students}
```

### Step 5: Important Notes

1. **Column Count**: You can create all 10 date columns, but only the dates that exist will be populated
2. **Empty Dates**: If a student doesn't have attendance for a specific date, that cell will be empty
3. **Date Order**: Dates are sorted with the most recent first (date1 = most recent)
4. **Flexible Columns**: You don't have to use all 10 columns - use as many as you typically need

### Step 6: Testing

1. Save your modified template
2. Replace the file at: `/public/reports/FM-USTP-ACAD-06-Attendance-and-Punctuality-Monitoring-Sheet.docx`
3. Test by generating a complete report from the Flutter app
4. Verify that:
   - Date headers appear correctly
   - Student rows show attendance for each date
   - Empty cells are handled gracefully

## Troubleshooting

### Issue: Dates not showing
- **Solution**: Make sure you're using `{date1}`, `{date2}`, etc. (with numbers, not `{date}`)

### Issue: Attendance symbols not appearing
- **Solution**: Check that the student row cells use `{date1}`, `{date2}`, etc., matching the header

### Issue: Too many empty columns
- **Solution**: The template will show all columns you create. If you have fewer dates, extra columns will be empty. Consider creating a template with fewer columns (e.g., 5-7) if you typically have fewer dates.

### Issue: Table formatting breaks
- **Solution**: Make sure all rows have the same number of columns. The header row and student rows must match.

## Alternative: Conditional Columns (Advanced)

If you want to show only the dates that exist, you would need to modify the API to use docxtemplater's conditional syntax. However, this is more complex and the current approach (showing all columns, with empty cells for missing dates) is simpler and more reliable.

## Data Structure Reference

**Header Fields:**
- `{date1}` through `{date10}` - Date headers (e.g., "November 28, 2025")

**Student Object Fields (inside {#students} loop):**
- `{no}` - Student number (1, 2, 3...)
- `{name}` - Student name
- `{course_year}` - Course and year (e.g., "BSIT 4D")
- `{attendance1}` through `{attendance10}` - Attendance symbol for each date (✓, L, X, or E)

**Other Available Fields:**
- `{subject}` - Subject name
- `{course_code}` - Course code
- `{schedule}` - Class schedule
- `{building_room}` - Building and room
- `{teacher}` - Teacher name
- `{department}` - Department
- `{total_students}` - Total number of students

