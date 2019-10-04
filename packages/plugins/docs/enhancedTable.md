# Enhanced Table

## Filters
Above each column in the table there is an input that allows for filtering the rows by data in the specific column. The there are currently three supported filter types.

### Text
The text filter allows filtering data based on the text in the column. The text is filtered using strict case insensitive filtering.

For example let's use  `['COLUMN1', 'column2']`.
- `col` will match with both
- `1` will only match the first

### Number
The number filter allows filtering columns based on max and min values. There are two input boxes above the supported columns with the left being the min value and right being the max value. The filtering range is inclusive.

For example let's use `[1, 2, 3, 4, 5]`.
- `min: 2, max: 4` will match `[2, 3, 4]`
- `min: 3` will match `[3, 4, 5]`
- `max: 3` will match `[1, 2, 3]`

### Date
The date filter allows filtering columns using dates. An accessible date picker is provided but dates can also be typed in manually. There are two input boxes above the supported columns with the left being the min date and right being the max date. The filtering date range is inclusive and time is set to midnight.

For example let's use `['2018-10-05, 6:10:10 a.m. EDT', '2018-03-15, 4:08:08 a.m. EDT']`.
- `min: 01/01/2017, max: 07/01/2018` will match the second item
- `min: 10/1/2018` will match the first item
- `max: 09/01/2018` will match the second item
