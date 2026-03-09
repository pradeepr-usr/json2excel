# # converter.py

from openpyxl import Workbook
from io import BytesIO
import time
from openpyxl.styles import Font


class SheetManager:

    def __init__(self, workbook):
        self.workbook = workbook
        self.sheets = {}
        self.headers = {}
        self.sheet_name_map = {}
        self.sheet_name_counter = {}
        self.column_widths = {}
        self.row_counts = {}

    def clean_sheet_name(self, name):
        base = name.split("_")[-1]
        if base not in self.sheet_name_counter:
            self.sheet_name_counter[base] = 1
            return base[:31]
        self.sheet_name_counter[base] += 1
        new_name = f"{base}_{self.sheet_name_counter[base]}"
        return new_name[:31]

    def get_sheet(self, raw_name):
        if raw_name not in self.sheet_name_map:
            clean = self.clean_sheet_name(raw_name)
            self.sheet_name_map[raw_name] = clean

        sheet_name = self.sheet_name_map[raw_name]

        if sheet_name not in self.sheets:
            if sheet_name == "root":
                sheet = self.workbook.active
                sheet.title = "root"
            else:
                sheet = self.workbook.create_sheet(sheet_name)

            self.sheets[sheet_name] = sheet
            self.headers[sheet_name] = None
            self.column_widths[sheet_name] = {}
            self.row_counts[sheet_name] = 0

        return sheet_name, self.sheets[sheet_name]

    def update_column_width(self, sheet_name, column_index, value):
        value_length = len(str(value)) if value is not None else 0
        current = self.column_widths[sheet_name].get(column_index, 0)
        if value_length > current:
            self.column_widths[sheet_name][column_index] = value_length

    def write_row(self, raw_name, row):
        sheet_name, sheet = self.get_sheet(raw_name)

        if self.headers[sheet_name] is None:
            headers = list(row.keys())
            self.headers[sheet_name] = headers
            sheet.append(headers)
            for cell in sheet[1]:
                cell.font = Font(bold=True)
            for idx, header in enumerate(headers, start=1):
                self.update_column_width(sheet_name, idx, header)

        headers = self.headers[sheet_name]
        values = [row.get(h) for h in headers]
        sheet.append(values)
        self.row_counts[sheet_name] += 1

        for idx, value in enumerate(values, start=1):
            self.update_column_width(sheet_name, idx, value)

    def apply_column_widths(self):
        for sheet_name, sheet in self.sheets.items():
            widths = self.column_widths[sheet_name]
            for col_idx, width in widths.items():
                col_letter = sheet.cell(row=1, column=col_idx).column_letter
                sheet.column_dimensions[col_letter].width = min(width + 2, 50)

    def get_total_rows(self):
        return sum(self.row_counts.values())


def extract_fields(data) -> list[str]:
    """
    Walk the JSON and return all leaf field paths.
    Arrays of objects use [] notation: items[].product
    """
    fields = []
    seen = set()

    def walk(node, prefix=""):
        if isinstance(node, dict):
            for k, v in node.items():
                path = f"{prefix}.{k}" if prefix else k
                if isinstance(v, dict):
                    walk(v, path)
                elif isinstance(v, list) and v and isinstance(v[0], dict):
                    walk(v[0], f"{path}[]")
                else:
                    if path not in seen:
                        seen.add(path)
                        fields.append(path)
        elif isinstance(node, list) and node:
            walk(node[0], prefix)

    walk(data)
    return fields


def json_to_excel_bytes(data, selected_fields: list[str] | None = None):
    """
    Convert JSON to Excel.
    selected_fields: if provided, only include these fields in root sheet.
                     Child sheets (arrays) are always included but also filtered.
    """
    start_time = time.time()

    # Build a set of selected fields for fast lookup
    # Also build per-sheet allowed columns derived from selected fields
    filter_active = selected_fields is not None and len(selected_fields) > 0

    workbook = Workbook()
    sheet_manager = SheetManager(workbook)

    global_id = 1

    def generate_id():
        nonlocal global_id
        current = global_id
        global_id += 1
        return current

    def flatten_dict(d, parent_key=""):
        items = {}
        stack = [(d, parent_key)]
        while stack:
            current_dict, prefix = stack.pop()
            for k, v in current_dict.items():
                new_key = f"{prefix}.{k}" if prefix else k
                if isinstance(v, dict):
                    stack.append((v, new_key))
                else:
                    items[new_key] = v
        return items

    def should_include_field(field_name: str, sheet_name: str) -> bool:
        """Check if a field should be included based on selected_fields."""
        if not filter_active:
            return True

        # Always keep _id and _parent_id
        if field_name in ("_id", "_parent_id"):
            return True

        # For root sheet: match directly
        if sheet_name == "root":
            return field_name in selected_fields

        # For child sheets (e.g. items): match fields like "items[].product"
        # sheet_name raw key ends with the array key e.g. "root_items"
        # selected_fields for child look like "items[].product"
        sheet_key = sheet_name.split("_")[-1]  # e.g. "items"
        qualified = f"{sheet_key}[].{field_name}"
        return qualified in selected_fields

    def process_node(node, sheet_name="root", parent_id=None):

        if isinstance(node, list):
            for item in node:
                process_node(item, sheet_name, parent_id)
            return

        if isinstance(node, dict):
            row = {}
            current_id = generate_id()
            row["_id"] = current_id
            row["_parent_id"] = parent_id

            for key, value in node.items():

                if isinstance(value, dict):
                    flat = flatten_dict(value, key)
                    for flat_key, flat_val in flat.items():
                        if should_include_field(flat_key, sheet_name):
                            row[flat_key] = flat_val

                elif isinstance(value, list):
                    if not value:
                        continue

                    child_sheet = f"{sheet_name}_{key}"

                    if all(isinstance(i, dict) for i in value):
                        for item in value:
                            process_node(item, child_sheet, current_id)
                    else:
                        for item in value:
                            primitive_row = {
                                "_id": generate_id(),
                                "_parent_id": current_id,
                                "value": item
                            }
                            sheet_manager.write_row(child_sheet, primitive_row)

                else:
                    if should_include_field(key, sheet_name):
                        row[key] = value

            sheet_manager.write_row(sheet_name, row)

    if isinstance(data, list):
        process_node(data, "root", None)
    elif isinstance(data, dict):
        process_node(data, "root", None)
    else:
        raise ValueError("Unsupported JSON structure")

    sheet_manager.apply_column_widths()

    output = BytesIO()
    workbook.save(output)
    output.seek(0)

    end_time = time.time()
    file_size_bytes = output.getbuffer().nbytes

    summary = {
        "sheets": len(sheet_manager.sheets),
        "rows": sheet_manager.get_total_rows(),
        "file_size_kb": round(file_size_bytes / 1024, 1),
        "time_sec": round(end_time - start_time, 3),
    }

    print("------ JSON → Excel Streaming Report ------")
    print(f"Sheets created : {summary['sheets']}")
    print(f"Total rows     : {summary['rows']}")
    print(f"File size      : {summary['file_size_kb']} KB")
    print(f"Time taken     : {summary['time_sec']}s")
    print(f"Field filter   : {'active' if filter_active else 'off'}")
    print("-------------------------------------------")

    return output, summary