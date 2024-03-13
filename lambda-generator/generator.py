import argparse
import os
from jinja2 import Environment, FileSystemLoader
import re

def generate_file(name, items):
    env = Environment(loader=FileSystemLoader('.'))
    env.filters['to_kebab_case'] = to_kebab_case

    for template_name in env.list_templates(extensions=["j2"]):
        template = env.get_template(template_name)

        output = template.render(
            name=name,
            items=items,
        )

        # Remove the .j2 extension from the template name for the output file
        output_file_name = os.path.splitext(template_name)[0]

        print(f'Writing {output_file_name}...')
        output_dir = os.path.join('../functions/clash-bot', name, os.path.dirname(output_file_name))
        os.makedirs(output_dir, exist_ok=True)
        
        with open(os.path.join(output_dir, os.path.basename(output_file_name)), 'w') as f:
            
            f.write(output)

def to_kebab_case(s):
    s = re.sub(r'(.)([A-Z][a-z]+)', r'\1-\2', s)
    return re.sub(r'([a-z0-9])([A-Z])', r'\1-\2', s).lower()

def main():
    parser = argparse.ArgumentParser(description='Generate a Terraform file for a Lambda function.')
    parser.add_argument('--name', required=True, help='The name of the Lambda function.')
    parser.add_argument('--items', nargs='+', help='A list of items.')

    args = parser.parse_args()

    generate_file(args.name, args.items)

if __name__ == "__main__":
    main()