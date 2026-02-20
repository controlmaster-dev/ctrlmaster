
def check_balance(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    stack = []
    
    # Map of closing to opening chars
    pairs = {')': '(', '}': '{', ']': '['}
    
    for line_num, line in enumerate(lines, 1):
        for char_pos, char in enumerate(line, 1):
            if char in '({[':
                stack.append((char, line_num, char_pos))
            elif char in ')}]':
                if not stack:
                    print(f"Error: Unmatched '{char}' at line {line_num}:{char_pos}")
                    return
                
                last_char, last_line, last_pos = stack.pop()
                if last_char != pairs[char]:
                    print(f"Error: Mismatched '{char}' at line {line_num}:{char_pos}. Expected closing for '{last_char}' from line {last_line}:{last_pos}")
                    return

    if stack:
        char, line, pos = stack[-1]
        print(f"Error: Unclosed '{char}' from line {line}:{pos}")
    else:
        print("All braces balanced!")

check_balance('src/app/configuracion/page.tsx')
