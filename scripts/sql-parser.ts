export function extractRoleGrants(sqlContent) {
  const grantStatements = extractGrantStatements(sqlContent);
  const roles = grantStatements.map(stmt => stmt.grantee);
  return [...new Set(roles)];
}

export function extractRoleCreations(sqlContent) {
  const cleanSql = removeComments(sqlContent);
  const roleRegex = /create\s+role\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi;
  const roles = [];
  let match;

  while ((match = roleRegex.exec(cleanSql)) !== null) {
    roles.push(match[1]);
  }

  return roles;
}

export function extractGrantStatements(sqlContent) {
  const statements = [];
  const grantRegex = /grant\s+([\w,\s]+)\s+on\s+(?:(schema|table)\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\s+to\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi;
  let match;

  while ((match = grantRegex.exec(sqlContent)) !== null) {
    if (isInComment(sqlContent, match.index)) {
      continue;
    }

    const privilegeString = match[1].trim();
    const privileges = privilegeString.split(',').map(p => p.trim().toUpperCase());
    const objectType = match[2] ? match[2].toUpperCase() : 'TABLE';
    const objectName = match[3];
    const grantee = match[4];

    const lineNumber = findLineNumber(sqlContent, match.index);

    statements.push({
      privileges,
      objectType,
      objectName,
      grantee,
      fileName: '',
      lineNumber
    });
  }

  return statements;
}

function removeComments(sqlContent) {
  let result = sqlContent;

  result = result.replace(/--.*$/gm, '');
  result = result.replace(/\/\*[\s\S]*?\*\//g, '');

  return result;
}

function findLineNumber(content, charIndex) {
  const beforeChar = content.substring(0, charIndex);
  return beforeChar.split('\n').length;
}

function isInComment(content, charIndex) {
  const beforeChar = content.substring(0, charIndex);

  const lines = beforeChar.split('\n');
  const currentLine = lines[lines.length - 1];
  const currentLineStart = beforeChar.length - currentLine.length;

  if (currentLine.includes('--')) {
    const commentStart = beforeChar.lastIndexOf('--');
    if (commentStart > currentLineStart) {
      return true;
    }
  }

  const blockCommentStart = beforeChar.lastIndexOf('/*');
  const blockCommentEnd = beforeChar.lastIndexOf('*/');

  if (blockCommentStart > blockCommentEnd) {
    return true;
  }

  return false;
}