export const replacePlaceholders = (values: Record<string, any>) =>
    (template: string): string => 
        template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => 
            values.hasOwnProperty(key) ? values[key] : match
        )
    

