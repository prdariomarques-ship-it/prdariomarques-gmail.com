// Proteção e imunização contra mutações no DOM causadas por tradutores automáticos do navegador
// (Google Translate, Microsoft Edge Translator) e extensões que quebram a reconciliação do React:
// "Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node."

if (typeof window !== 'undefined' && typeof Node === 'function' && Node.prototype) {
  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn(
          '[FlowCore DOM Guard] Nó de referência modificado externamente (ex: tradutor de navegador). Utilizando fallback seguro.',
          { parent: this, referenceNode }
        );
      }
      return this.appendChild(newNode);
    }
    return originalInsertBefore.call(this, newNode, referenceNode);
  };

  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn(
          '[FlowCore DOM Guard] Tentativa de remoção de nó já alterado por tradutor/extensão.',
          { parent: this, child }
        );
      }
      return child;
    }
    return originalRemoveChild.call(this, child);
  };
}

export {};
