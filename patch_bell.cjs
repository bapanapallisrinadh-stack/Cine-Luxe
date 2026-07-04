const fs = require('fs');
let code = fs.readFileSync('src/components/MovieModal.tsx', 'utf-8');

code = code.replace(
  "{hasReminder ? <Check className=\"w-4 h-4\" /> : <Plus className=\"w-4 h-4\" />}",
  "{hasReminder ? <Check className=\"w-4 h-4\" /> : <Bell className=\"w-4 h-4\" />}"
);

fs.writeFileSync('src/components/MovieModal.tsx', code);
