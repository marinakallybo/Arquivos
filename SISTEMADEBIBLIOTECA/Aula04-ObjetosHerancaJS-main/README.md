# Sistema de Biblioteca

Projeto desenvolvido como atividade da aula 04, focado na modelagem de um acervo utilizando POO e polimorfismo


## Estrutura do Projeto

* **ItemAcervo**: Classe base com `titulo` e o método `gerarDescricao()`.
* **Livro**: Subclasse com `autor` que utiliza `super` para reaproveitar a classe base e sobrescreve `gerarDescricao()`.
* **Revista**: Subclasse com `edicao` que segue a mesma lógica de herança e sobrescrita.
* **Array Misto e forEach**: Demonstração de polimorfismo ao listar a descrição completa de cada item.


## Como Executar

### Pré-requisito
* [Node.js](https://nodejs.org/) instalado na máquina.

### Passo a Passo

1. **Clonar o repositório:**
   ```bash
   git clone [https://github.com/seu-usuario/seu-repositorio.git](https://github.com/seu-usuario/seu-repositorio.git)

2. **Entrar no diretório do projeto:**
   ```bash
   cd seu-repositorio

3. **Executar a aplicação:**
   ```bash
   node biblioteca.js
