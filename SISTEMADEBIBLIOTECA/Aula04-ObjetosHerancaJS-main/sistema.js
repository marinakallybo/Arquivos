// sistema de biblioteca

// classe pai
class ItemAcervo{

    constructor(titulo) {
        this.titulo = titulo;
    }

    gerarDescricao(){
        return `Título: ${this.titulo}`;
    }
}

// subclasse Livro
class Livro extends ItemAcervo {
    constructor(titulo, autor) {
        super(titulo);
        this.autor = autor;
    }

    gerarDescricao() {
        return `${super.gerarDescricao()} | Autor: ${this.autor}`;
    }
}

// subclasse revista

class Revista extends ItemAcervo {
    constructor(titulo, edicao) {
        super(titulo);
        this.edicao = edicao;
    }

    gerarDescricao() {
        return `${super.gerarDescricao()} | Edição: número ${this.edicao}`;
    }
}

// array exemplo com instâncias das subclasses
const acervo = [
    new Livro("A dama das camélias", "Alexandre Dumas"),
    new Revista("Revista da Avon", 2025),
    new Livro("Vidas secas", "Graciliano Ramos"),
    new Revista("Catálogo: O Boticário", 2026)
];

// cabeçalho da aplicação para deixar mais personalizado
console.log("");
console.log("=== IFSP | Sistema de Biblioteca - Listando Itens Existentes ===");
console.log("");

// for each - polimorfismo
acervo.forEach(item => {
    console.log(item.gerarDescricao());
});