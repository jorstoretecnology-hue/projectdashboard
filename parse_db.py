import re
import json

def parse_sql_dump(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Data structures
    tables = {} 
    views = []
    functions = []
    policies = []
    triggers = []
    indexes = []
    fks = []
    pks = []

    # 1. Parse Tables
    table_regex = re.compile(r"CREATE TABLE (?:public\.)?\"?([a-zA-Z_0-9]+)\"? \((.*?)\);", re.DOTALL)
    for match in table_regex.finditer(content):
        table_name = match.group(1)
        columns_text = match.group(2)
        columns = []
        is_multitenant = False
        
        for line in columns_text.split('\n'):
            line = line.strip()
            if not line or line.startswith('CONSTRAINT') or line.startswith('PRIMARY KEY'):
                continue
            parts = line.split(maxsplit=2)
            if len(parts) >= 2:
                col_name = parts[0].replace('"', '')
                col_type = parts[1].replace(',', '')
                columns.append({
                    "name": col_name,
                    "type": col_type,
                })
                if col_name == 'tenant_id':
                    is_multitenant = True
                    
        tables[table_name] = {
            "columns": columns,
            "is_multitenant": is_multitenant
        }

    # 2. Parse Views
    view_regex = re.compile(r"CREATE VIEW (?:public\.)?\"?([a-zA-Z_0-9]+)\"? AS")
    for match in view_regex.finditer(content):
        views.append(match.group(1))

    # 3. Parse Functions
    func_regex = re.compile(r"CREATE FUNCTION (?:public\.)?\"?([a-zA-Z_0-9]+)\"?\s*\((.*?)\)\s+RETURNS ([\w\s]+)")
    for match in func_regex.finditer(content):
        functions.append({"name": match.group(1), "args": match.group(2), "returns": match.group(3)})

    # 4. Parse Policies
    policy_regex = re.compile(r"CREATE POLICY \"?([^\"]+)\"? ON (?:public\.)?\"?([a-zA-Z_0-9]+)\"?")
    for match in policy_regex.finditer(content):
        policies.append({"name": match.group(1), "table": match.group(2)})

    # 5. Parse Triggers
    trigger_regex = re.compile(r"CREATE TRIGGER \"?([^\"]+)\"?\s+(?:AFTER|BEFORE)\s+[a-zA-Z_]+\s+ON\s+(?:public\.)?\"?([a-zA-Z_0-9]+)\"?")
    for match in trigger_regex.finditer(content):
        triggers.append({"name": match.group(1), "table": match.group(2)})

    # 6. Parse Constraints (PK and FK)
    alter_table_regex = re.compile(r"ALTER TABLE ONLY (?:public\.)?\"?([a-zA-Z_0-9]+)\"?\n\s+ADD CONSTRAINT \"?([^\"]+)\"? (PRIMARY KEY|FOREIGN KEY) (.*);")
    for match in alter_table_regex.finditer(content):
        table = match.group(1)
        name = match.group(2)
        ctype = match.group(3)
        details = match.group(4)
        if ctype == "PRIMARY KEY":
            pks.append({"table": table, "name": name, "details": details})
        elif ctype == "FOREIGN KEY":
            fks.append({"table": table, "name": name, "details": details})

    # 7. Parse Indexes
    index_regex = re.compile(r"CREATE (?:UNIQUE )?INDEX \"?([^\"]+)\"? ON (?:public\.)?\"?([a-zA-Z_0-9]+)\"?")
    for match in index_regex.finditer(content):
        indexes.append({"name": match.group(1), "table": match.group(2)})

    # Generate Markdown
    md = "# 📋 Inventario Técnico de Base de Datos\n\n> Generado automáticamente desde el schema actual.\n\n"
    
    multitenant_tables = {k:v for k,v in tables.items() if v["is_multitenant"]}
    global_tables = {k:v for k,v in tables.items() if not v["is_multitenant"]}
    
    md += "## 🏢 Tablas Multi-Tenant (Protegidas por RLS)\n"
    for name, data in multitenant_tables.items():
        md += f"### `{name}`\n"
        for c in data['columns']:
            md += f"- `{c['name']}` ({c['type']})\n"
        md += "\n"
        
    md += "## 🌍 Tablas Globales\n"
    for name, data in global_tables.items():
        md += f"### `{name}`\n"
        for c in data['columns']:
            md += f"- `{c['name']}` ({c['type']})\n"
        md += "\n"
        
    md += "## 👁️ Vistas (Views - Ignorar en modificaciones)\n"
    if not views: md += "_Ninguna_\n"
    for view in views:
        md += f"- `{view}`\n"
    md += "\n"
    
    md += "## 🔑 Claves y Restricciones\n"
    md += "### Primary Keys\n"
    for pk in pks:
        md += f"- **{pk['table']}**: `{pk['details']}` ({pk['name']})\n"
    md += "\n### Foreign Keys\n"
    for fk in fks:
        md += f"- **{fk['table']}**: `{fk['details']}` ({fk['name']})\n"
    md += "\n"
    
    md += "## ⚡ Índices\n"
    for idx in indexes:
        md += f"- **{idx['table']}**: `{idx['name']}`\n"
    if not indexes: md += "_Ninguno encontrado_\n"
    md += "\n"
    
    md += "## 🛡️ Políticas RLS (Row Level Security)\n"
    policies.sort(key=lambda x: x['table'])
    for pol in policies:
        md += f"- **{pol['table']}**: `{pol['name']}`\n"
    if not policies: md += "_Ninguna política encontrada_\n"
    md += "\n"
    
    md += "## 🤖 Triggers\n"
    for trg in triggers:
        md += f"- **{trg['table']}**: `{trg['name']}`\n"
    if not triggers: md += "_Ningun trigger encontrado_\n"
    md += "\n"
    
    md += "## 🛠️ Funciones (RPC / Helpers)\n"
    for func in functions:
        md += f"- `{func['name']}({func['args']}) -> {func['returns']}`\n"
    if not functions: md += "_Ninguna función encontrada_\n"
        
    with open('E:/ProyectDashboard/docs/technical/INVENTORY_DB.md', 'w', encoding='utf-8') as out:
        out.write(md)
        
    print("Report generated successfully")

parse_sql_dump('E:/ProyectDashboard/backup_completo.sql')
