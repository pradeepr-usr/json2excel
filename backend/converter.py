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

        # Track column width
        self.column_widths = {}

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

            # Ensure ROOT sheet always first
            if sheet_name == "root":
                sheet = self.workbook.active
                sheet.title = "root"
            else:
                sheet = self.workbook.create_sheet(sheet_name)

            self.sheets[sheet_name] = sheet
            self.headers[sheet_name] = None
            self.column_widths[sheet_name] = {}

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
            
            # Make headers bold
            for cell in sheet[1]:
                cell.font = Font(bold=True)

            for idx, header in enumerate(headers, start=1):
                self.update_column_width(sheet_name, idx, header)

        headers = self.headers[sheet_name]

        values = [row.get(h) for h in headers]

        sheet.append(values)

        for idx, value in enumerate(values, start=1):
            self.update_column_width(sheet_name, idx, value)

    def apply_column_widths(self):

        for sheet_name, sheet in self.sheets.items():

            widths = self.column_widths[sheet_name]

            for col_idx, width in widths.items():

                col_letter = sheet.cell(row=1, column=col_idx).column_letter

                sheet.column_dimensions[col_letter].width = min(width + 2, 50)


def json_to_excel_bytes(data):

    start_time = time.time()

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

                    row.update(flatten_dict(value, key))

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

                    row[key] = value

            sheet_manager.write_row(sheet_name, row)

    if isinstance(data, list):
        process_node(data, "root", None)

    elif isinstance(data, dict):
        process_node(data, "root", None)

    else:
        raise ValueError("Unsupported JSON structure")

    # Apply column auto width
    sheet_manager.apply_column_widths()

    output = BytesIO()

    workbook.save(output)

    output.seek(0)

    end_time = time.time()

    print("------ JSON → Excel Streaming Report ------")
    print(f"Sheets created: {len(sheet_manager.sheets)}")
    print(f"Time taken: {round(end_time - start_time,3)}s")
    print("-------------------------------------------")

    return output