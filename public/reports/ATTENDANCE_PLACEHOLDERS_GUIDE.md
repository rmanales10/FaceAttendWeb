# Attendance Placeholders Guide for Word Template

## Understanding the Placeholder System

The complete attendance report uses **different placeholder names** for date headers and attendance symbols:

- **Header Row**: `{date1}`, `{date2}`, etc. display the **actual dates** (e.g., "11/28/2025")
- **Student Rows**: `{attendance1}`, `{attendance2}`, etc. display the **attendance symbols** (✓, L, X, E) for that date

## Template Structure

### Header Row (Date Columns)

In your Word template's header row, use `{date1}` through `{date10}` to show the dates:

```
| No. | Name of Student | Course & Year | {date1} | {date2} | {date3} | {date4} | {date5} | ... |
```

**What appears**: The actual formatted dates like "11/28/2025", "11/25/2025", etc.

### Student Data Row (Attendance Symbols)

In the student row (inside the `{#students}...{/students}` loop), use `{attendance1}` through `{attendance10}`:

```
{#students}
| {no} | {name} | {course_year} | {attendance1} | {attendance2} | {attendance3} | {attendance4} | {attendance5} | ... |
{/students}
```

**What appears**: Attendance symbols (✓, L, X, E) for each student on each date.

## Complete Example

Here's how your Word template table should look:

### Table Header
```
┌─────┬──────────────────┬──────────────┬──────────┬──────────┬──────────┬──────────┐
│ No. │ Name of Student  │ Course &Year │ {date1}  │ {date2}  │ {date3}  │ {date4}  │
└─────┴──────────────────┴──────────────┴──────────┴──────────┴──────────┴──────────┘
```

### Student Row (Inside Loop)
```
{#students}
┌─────┬──────────────────┬──────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│ {no}│ {name}           │ {course_year}│ {attendance1}│ {attendance2}│ {attendance3}│ {attendance4}│
└─────┴──────────────────┴──────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
{/students}
```

## Attendance Symbols

The system uses these symbols:
- **✓** = Present
- **L** = Late  
- **X** = Absent
- **E** = Excuse
- **(empty)** = No attendance record for that date

## Step-by-Step: How to Set Up Your Word Template

### Step 1: Create the Header Row

1. Open your Word template
2. In the table header row, create columns for dates:
   - Column 1: `No.`
   - Column 2: `Name of Student`
   - Column 3: `Course & Year`
   - Column 4: `{date1}`
   - Column 5: `{date2}`
   - Column 6: `{date3}`
   - ... continue up to `{date10}` if needed

**Important**: Type the placeholders exactly as shown: `{date1}`, `{date2}`, etc.

### Step 2: Create the Student Row (Inside Loop)

1. Create one row that will be repeated for each student
2. At the **START** of the row, type: `{#students}`
3. In the row cells, use:
   - Cell 1: `{no}`
   - Cell 2: `{name}`
   - Cell 3: `{course_year}`
   - Cell 4: `{attendance1}` ← This will show attendance symbol for date1
   - Cell 5: `{attendance2}` ← This will show attendance symbol for date2
   - Cell 6: `{attendance3}` ← This will show attendance symbol for date3
   - ... continue matching the header columns
4. At the **END** of the row, type: `{/students}`

### Step 3: Visual Example

Here's what your template should look like in Word:

```
┌─────┬──────────────────────┬──────────────┬────────────┬────────────┬────────────┐
│ No. │ Name of Student      │ Course &Year │ {date1}     │ {date2}     │ {date3}     │
├─────┼──────────────────────┼──────────────┼────────────┼────────────┼────────────┤
│{#students}                                                                        │
│ {no}│ {name}               │ {course_year}│ {attendance1}│ {attendance2}│ {attendance3}│
│{/students}                                                                        │
└─────┴──────────────────────┴──────────────┴────────────┴────────────┴────────────┘
```

### Step 4: Generated Output

When the report is generated, it will look like this:

```
┌─────┬──────────────────────┬──────────────┬────────────┬────────────┬────────────┐
│ No. │ Name of Student      │ Course &Year │ 11/28/2025 │ 11/25/2025 │ 11/22/2025 │
├─────┼──────────────────────┼──────────────┼────────────┼────────────┼────────────┤
│  1  │ John Doe             │ BSIT 4D      │     ✓      │     L      │     X      │
│  2  │ Jane Smith           │ BSIT 4D      │     ✓      │     ✓      │     E      │
│  3  │ Bob Johnson          │ BSIT 4D      │     X      │     ✓      │     ✓      │
└─────┴──────────────────────┴──────────────┴────────────┴────────────┴────────────┘
```

## Key Points to Remember

1. **Different Placeholder Names**: 
   - Header uses `{date1}`, `{date2}`, etc. (shows dates)
   - Student row uses `{attendance1}`, `{attendance2}`, etc. (shows symbols)
2. **Column Alignment**: Make sure the header columns and student row columns align perfectly
3. **Loop Syntax**: Always use `{#students}` at the start and `{/students}` at the end of the student row
4. **Up to 10 Dates**: You can create up to 10 date columns (`{date1}` through `{date10}`) and corresponding attendance columns (`{attendance1}` through `{attendance10}`)
5. **Empty Cells**: If a student doesn't have attendance for a date, that cell will be empty

## Common Mistakes to Avoid

❌ **Wrong**: Using `{date1}` in student rows for attendance symbols
✅ **Correct**: Use `{attendance1}`, `{attendance2}`, etc. in student rows

❌ **Wrong**: Using `{attendance1}` in header row
✅ **Correct**: Use `{date1}`, `{date2}`, etc. in header row

❌ **Wrong**: Missing `{#students}` or `{/students}` tags
✅ **Correct**: Always include both loop tags

❌ **Wrong**: Mismatched number of columns between header and student row
✅ **Correct**: Header and student row must have the same number of columns

## Template Structure Summary

**Header Row:**
```
| No. | Name of Student | Course & Year | {date1} | {date2} | {date3} | ... |
```

**Student Row (Inside Loop):**
```
{#students}
| {no} | {name} | {course_year} | {attendance1} | {attendance2} | {attendance3} | ... |
{/students}
```

## Testing Your Template

1. Save your template as: `FM-USTP-ACAD-06-Attendance-and-Punctuality-Monitoring-Sheet.docx`
2. Place it in: `/public/reports/` folder
3. Generate a complete report from the Flutter app
4. Check that:
   - Date headers show correctly (e.g., "11/28/2025")
   - Student rows show attendance symbols (✓, L, X, E) in the correct columns
   - All columns align properly

## Need Help?

If attendance symbols are not appearing:
1. Verify you're using `{attendance1}`, `{attendance2}`, etc. in student rows (not `{date1}`, `{date2}`)
2. Check that the student row columns match the header columns in number
3. Ensure `{#students}` and `{/students}` tags are correctly placed
4. Verify the template file is in the correct location
