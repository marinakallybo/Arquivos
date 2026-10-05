const botoes = document.querySelectorAll(".filtros button");
const pratos = document.querySelectorAll(".prato");

// classes
class ItemCardapio {
    constructor(nome, categoria) {
        this.nome = nome;
        this.categoria = categoria;
    }

    filtrarPorCategoria(categoria) {
        return this.categoria === categoria;
    }
}

class Bebida extends ItemCardapio {
    constructor(nome) {
        super(nome, "bebidas");
    }
}

// objetos
const onigiri = Object.freeze(new ItemCardapio("Onigiri", "pratos"));
const ramen = Object.freeze(new ItemCardapio("Ramen", "pratos"));
const mochi = Object.freeze(new ItemCardapio("Mochi", "sobremesas"));
const matcha = Object.freeze(new Bebida("Matcha"));

// evento de clique nos botões
botoes.forEach(botao => {
    botao.addEventListener("click", function() {
        const categoria = this.dataset.categoria;
        mostrarItens(categoria);
    });
});

// exibir ou ocultar os pratos
function mostrarItens(categoria) {
    pratos.forEach(prato => {
        const categoriaPrato = prato.dataset.categoria;

        if (categoria === "todos" || categoriaPrato === categoria) {
            prato.style.display = "block";
        } else {
            prato.style.display = "none";
        }
    });
}