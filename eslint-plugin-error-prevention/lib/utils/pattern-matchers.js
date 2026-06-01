function matchImportPattern(source) {
  if (!source || typeof source !== 'string') {
    return {
      isRelative: false,
      hasExtension: false,
      extension: null,
      isAbsolute: false,
      isPackage: false
    };
  }

  const isRelative = source.startsWith('./') || source.startsWith('../');
  const isAbsolute = source.startsWith('/') || source.startsWith('@/');
  const isPackage = !isRelative && !isAbsolute;

  const extensionMatch = source.match(/\.(js|ts|tsx|jsx|json|css|scss|less|png|jpg|svg|woff|woff2)$/);
  const hasExtension = Boolean(extensionMatch);
  const extension = extensionMatch ? extensionMatch[1] : null;

  return {
    isRelative,
    isAbsolute,
    isPackage,
    hasExtension,
    extension
  };
}

function matchSQLPattern(str) {
  if (!str || typeof str !== 'string') {
    return {
      hasSQL: false,
      isDynamic: false,
      hasValues: false,
      hasColumns: false,
      keywords: []
    };
  }

  const sqlKeywords = /\b(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|FROM|WHERE|JOIN|UNION|VALUES)\b/gi;
  const keywordMatches = str.match(sqlKeywords) || [];
  const hasSQL = keywordMatches.length > 0;

  const isDynamic = /\$\{[^}]*\}|\+|\`[^`]*\$\{/.test(str);

  const hasValues = /VALUES\s*\(/i.test(str);
  const hasColumns = /INSERT\s+INTO\s+\w+\s*\(/i.test(str);

  return {
    hasSQL,
    isDynamic,
    hasValues,
    hasColumns,
    keywords: keywordMatches.map(kw => kw.toUpperCase())
  };
}

function matchErrorPattern(node) {
  if (!node) {
    return {
      isGenericError: false,
      hasContext: false,
      preservesOriginal: false,
      isThrowStatement: false,
      isInCatchBlock: false
    };
  }

  const isGenericError = node.type === 'NewExpression' &&
                        node.callee &&
                        node.callee.name === 'Error' &&
                        (!node.arguments || node.arguments.length <= 1);

  const hasContext = node.arguments &&
                    node.arguments.length > 0 &&
                    (
                      (node.arguments[0].type === 'ObjectExpression' && node.arguments[0].properties.length > 0) ||
                      (node.arguments[0].type === 'Literal' && typeof node.arguments[0].value === 'string' && node.arguments[0].value.length > 10)
                    );

  const preservesOriginal = node.arguments &&
                           node.arguments.length > 1 &&
                           node.arguments.some(arg =>
                             arg.type === 'Identifier' &&
                             (arg.name === 'error' || arg.name === 'err' || arg.name === 'originalError')
                           );

  const isThrowStatement = node.type === 'ThrowStatement';
  const isInCatchBlock = node.parent && node.parent.type === 'CatchClause';

  return {
    isGenericError,
    hasContext,
    preservesOriginal,
    isThrowStatement,
    isInCatchBlock
  };
}

function matchCorrelationIdPattern(node) {
  if (!node || node.type !== 'FunctionDeclaration') {
    return {
      isApiHandler: false,
      hasCorrelationId: false,
      httpMethod: null,
      hasRequestParam: false
    };
  }

  const functionName = node.id ? node.id.name : '';
  const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
  const httpMethod = httpMethods.find(method =>
    functionName.toUpperCase().includes(method) ||
    functionName.includes(method.toLowerCase())
  );

  const isApiHandler = Boolean(httpMethod) ||
                      functionName.includes('handler') ||
                      functionName.includes('endpoint') ||
                      functionName.includes('route') ||
                      (node.params && node.params.some(param =>
                        param.name === 'req' || param.name === 'request' || param.name === 'ctx'
                      ));

  const hasRequestParam = node.params && node.params.some(param =>
    param.name === 'req' || param.name === 'request' || param.name === 'ctx'
  );

  const hasCorrelationId = node.body && hasCorrelationIdUsage(node.body);

  return {
    isApiHandler,
    hasCorrelationId,
    httpMethod,
    hasRequestParam
  };
}

function hasCorrelationIdUsage(body) {
  if (!body || !body.body) return false;

  function checkNode(node) {
    if (!node) return false;

    if (node.type === 'VariableDeclarator' &&
        node.id && node.id.name &&
        (node.id.name.includes('correlation') || node.id.name.includes('requestId'))) {
      return true;
    }

    if (node.type === 'MemberExpression' &&
        node.property && node.property.name &&
        (node.property.name.includes('correlation') || node.property.name.includes('requestId'))) {
      return true;
    }

    if (node.type === 'Literal' &&
        typeof node.value === 'string' &&
        (node.value.includes('correlation') || node.value.includes('request-id'))) {
      return true;
    }

    for (const key in node) {
      if (node.hasOwnProperty(key) && typeof node[key] === 'object') {
        if (Array.isArray(node[key])) {
          if (node[key].some(checkNode)) return true;
        } else if (checkNode(node[key])) {
          return true;
        }
      }
    }

    return false;
  }

  return body.body.some(checkNode);
}

module.exports = {
  matchImportPattern,
  matchSQLPattern,
  matchErrorPattern,
  matchCorrelationIdPattern,
  hasCorrelationIdUsage
};