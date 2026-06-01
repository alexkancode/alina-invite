function getSourceValue(node) {
  if (!node || !node.source) return null;
  return node.source.value;
}

function hasTypeScriptExtension(source) {
  if (!source || typeof source !== 'string') return null;

  const match = source.match(/\.(ts|tsx)$/);
  return match ? match[0] : null;
}

function removeExtension(source, extension) {
  if (!source || !extension) return source;
  return source.replace(new RegExp(extension.replace('.', '\\.') + '$'), '');
}

function isImportDeclaration(node) {
  return node && node.type === 'ImportDeclaration';
}

function isExportDeclaration(node) {
  return node && (
    node.type === 'ExportNamedDeclaration' ||
    node.type === 'ExportAllDeclaration'
  );
}

function isSQLKeyword(str) {
  if (!str || typeof str !== 'string') return false;
  return /\b(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|FROM|WHERE|JOIN|UNION)\b/i.test(str);
}

function isStringConcatenation(node) {
  return node &&
         node.type === 'BinaryExpression' &&
         node.operator === '+' &&
         (node.left.type === 'Literal' || node.right.type === 'Literal');
}

function isCatchClause(node) {
  return node && node.type === 'CatchClause';
}

function hasErrorLogging(block) {
  if (!block || !block.body) return false;

  function checkStatement(stmt) {
    if (stmt.type === 'ExpressionStatement') {
      const expr = stmt.expression;
      if (expr.type === 'CallExpression') {
        const callee = expr.callee;

        if (callee.type === 'MemberExpression') {
          const object = callee.object;
          const property = callee.property;

          return (
            (object.name === 'console' &&
             (property.name === 'error' || property.name === 'log' || property.name === 'warn')) ||
            (object.name === 'logger' &&
             (property.name === 'error' || property.name === 'warn' || property.name === 'info'))
          );
        }
      }
    }
    return false;
  }

  if (Array.isArray(block.body)) {
    return block.body.some(checkStatement);
  } else if (block.body) {
    return checkStatement(block.body);
  }

  return false;
}

function isGenericErrorConstruction(node) {
  return node &&
         node.type === 'NewExpression' &&
         node.callee &&
         node.callee.name === 'Error' &&
         (!node.arguments || node.arguments.length <= 1);
}

function hasContextInError(node) {
  if (!node || !node.arguments || node.arguments.length === 0) return false;

  const firstArg = node.arguments[0];
  if (firstArg.type === 'ObjectExpression') {
    return firstArg.properties.length > 1;
  }

  return false;
}

module.exports = {
  getSourceValue,
  hasTypeScriptExtension,
  removeExtension,
  isImportDeclaration,
  isExportDeclaration,
  isSQLKeyword,
  isStringConcatenation,
  isCatchClause,
  hasErrorLogging,
  isGenericErrorConstruction,
  hasContextInError
};