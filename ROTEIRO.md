# Roteiro de demonstração (cerca de 7 minutos)

**Antes de começar:** rode `npm run demo:reset` e depois `npm run dev`. Deixe aberto `http://localhost:5173/entrar` e, numa segunda aba, o terminal da API (o código do e-mail aparece lá).

1. **Login e sessão** (1 min)
   - Mostre a tela dividida com o mascote.
   - Clique em "Entrar" vazio: aparecem os erros nos campos.
   - Use "Usar conta de demonstração", deixe "Manter conectado" marcado e entre.
   - Recarregue a página (F5): a sessão continua (JWT no localStorage).

2. **Início e progresso** (1 min 30 s)
   - Apresente o dashboard: Lendo agora, Meta de novembro (5 de 8, 63%), sequência e Sugerido para você.
   - Em "Atualizar progresso", digite 481: a prévia mostra 68% → 72% e "+25 páginas hoje".
   - Salve: o aviso confirma e o destaque passa a "Faltam 191 páginas".

3. **Buscar e adicionar** (1 min)
   - Em Explorar, busque "ficção" e filtre por "Fantasia".
   - Busque "xyz" para mostrar o estado vazio com orientação.
   - Busque "Fundação" e clique em "Quero ler": o aviso tem "Desfazer".
   - Abra a seta do botão e mude para "Lendo agora" (um status por vez).

4. **Livro, avaliação e média** (1 min 30 s)
   - Abra "O Hobbit": sinopse, gêneros, ficha técnica e a nota média.
   - Em "Editar avaliação", troque a nota e publique.
   - Mostre a nova média no aviso e a avaliação sem texto como "Sem comentário" na aba Resenhas.

5. **Concluir e bater a meta** (1 min)
   - Em Metas, edite a meta do mês para 6 livros.
   - No Início, em "Também lendo", abra "Atelier of Witch Hat", clique em "Atualizar progresso" e registre a página 192 (100%).
   - O livro vai sozinho para Concluído, o modal mostra "Meta atingida!" e a barra fica completa.

6. **Comunidade e perfil** (1 min)
   - Em Comunidade, curta uma discussão e abra a de Duna para responder.
   - Abra o perfil de Alexandre e clique em "Seguir".
   - Volte ao seu perfil para mostrar as estatísticas (livros lidos, avaliações, meta do mês).

7. **Responsividade e encerramento** (1 min)
   - Reduza a janela (ou use F12 › modo celular): a barra de abas aparece embaixo e o modal vira gaveta.
   - Em Configurações › Sair da conta, o token é removido e você volta ao login.
   - Se sobrar tempo: crie uma conta nova e mostre o código de 6 dígitos (modo demonstração) e o onboarding.

**Frase de fechamento sugerida:** "O Readex é full stack: Vue 3 no front, API Fastify com JWT, PostgreSQL via Prisma e todas as telas vieram do Figma, com tokens e componentes reaproveitados."
