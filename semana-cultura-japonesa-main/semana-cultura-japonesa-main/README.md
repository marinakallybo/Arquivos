# Semana da Cultura Japonesa

Página de divulgação e filtro interativo para um evento fictício de culinária e cultura japonesa. Projeto desenvolvido para a atividade de Desenvolvimento Web.

## Requisitos Técnicos Implementados

### JavaScript (POO & Manipulação do DOM)
- **F. Objeto / Imutabilidade:** Instâncias de itens do cardápio congeladas com `Object.freeze()`.
- **E. Função:** Funções para captura de eventos e alteração visual dos elementos.
- **D. Método:** Métodos internos nas classes, como `filtrarPorCategoria()`.
- **C. Subclasse / Herança:** Classe `Bebida` herdando de `ItemCardapio` com `extends` e `super`.
- **B. Classe (POO):** Estrutura base `ItemCardapio` orientada a objetos.

### HTML5
- **Estrutura Semântica:** Documento com `header`, `nav`, `main`, `section`, `article`, `figure`, `figcaption`, `footer` e `address`.
- **Acessibilidade & Mídia:** Elemento `<audio controls>`, atributos `alt` em imagens e hierarquia correta de títulos (`h1` a `h3`).
- **SEO & Meta tags:** Configuração de `viewport`, `charset`, `description` e Open Graph.

### CSS3
- **Layout & Responsividade:** Flexbox, CSS Grid e Media Queries para Desktop, Tablet e Mobile.
- **Estilização Avançada:** Uso de seletores compostos, pseudo-classes (`:hover`, `:first-child`), pseudo-elementos (`::before`) e fontes personalizadas.

## Estrutura da Página

- **Cabeçalho:** Navegação principal e marca do evento.
- **Apresentação:** Informações de data, local e chamada para ação.
- **Programação:** Cronograma completo dos dois dias.
- **Cardápio Interativo:** Filtro funcional de pratos, bebidas e sobremesas via JavaScript.
- **Galeria & Mídia:** Fotos de edições anteriores e player de áudio ambiente.
- **Ingressos & Rodapé:** Tipos de entrada, localização e contatos.