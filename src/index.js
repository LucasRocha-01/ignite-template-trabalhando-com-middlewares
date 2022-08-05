const express = require("express");
const cors = require("cors");

const { v4: uuidv4, validate } = require("uuid");

const app = express();
app.use(express.json());
app.use(cors());

const users = [
  {
    id: "21a38b56-92e7-444a-b087-cb4ed14dd8f0",
    name: "Lucas",
    username: "Skyter",
    pro: false,
    todos: [
      {
        id: "28abf9a7-94a8-48bd-bcda-59029a6d8442",
        title: "teste",
        deadline: "2022-08-20T00:00:00.000Z",
        done: false,
        created_at: "2022-08-05T02:09:39.033Z",
      },
    ],
  },
];

function checksExistsUserAccount(request, response, next) {
  // Complete aqui
  const { username } = request.headers;

  const user = users.find((user) => user.username == username);

  if (!user) {
    return response.status(404).json({ error: "Username not exists." });
  }

  request.user = user;

  next();
}

function checksCreateTodosUserAvailability(request, response, next) {
  const { user } = request;

  if (user.pro == true) {
    next();
  } else if (user.todos.length >= 10) {
    return response.status(403).json({
      error:
        "Num of todos exceeded, please buy pro plan. Num of todos: " +
        user.todos.length,
    });
  } else {
    next();
  }
}

function checksTodoExists(request, response, next) {
  const { id } = request.params;
  const { username } = request.headers;

  const user = users.find((user) => user.username == username);

  if (!validate(id)) {
    return response.status(400).json({ error: "Id is not a uuid" });
  }
  if (!user) {
    return response.status(404).json({ error: "Username not exists." });
  }

  const myToDo = user.todos.find((todo) => todo.id == id);

  if (!myToDo) {
    return response.status(404).json({ error: "Todo not exists." });
  }

  request.user = user;
  request.todo = myToDo;

  next();
  return response.status(204).json(myToDo);
}

function findUserById(request, response, next) {
  // Complete aqui
  const { id } = request.params;

  const user = users.find((user) => user.id == id);

  if (!user) {
    return response.status(404).json({ error: "ID not exists." });
  }

  const username = user.username;

  const userUsername = users.find((user) => user.username == username);
  if (!userUsername) {
    return response.status(404).json({ error: "Username not exists." });
  }

  request.user = user;

  next();
}

app.post("/users", (request, response) => {
  const { name, username } = request.body;

  const usernameAlreadyExists = users.some(
    (user) => user.username === username
  );

  if (usernameAlreadyExists) {
    return response.status(400).json({ error: "Username already exists" });
  }

  const user = {
    id: uuidv4(),
    name,
    username,
    pro: false,
    todos: [],
  };

  users.push(user);

  return response.status(201).json(user);
});

app.get("/users/:id", findUserById, (request, response) => {
  const { user } = request;

  return response.json(user);
});

app.patch("/users/:id/pro", findUserById, (request, response) => {
  const { user } = request;

  if (user.pro) {
    return response
      .status(400)
      .json({ error: "Pro plan is already activated." });
  }

  user.pro = true;

  return response.json(user);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return response.json(user.todos);
});

app.post(
  "/todos",
  checksExistsUserAccount,
  checksCreateTodosUserAvailability,
  (request, response) => {
    const { title, deadline } = request.body;
    const { user } = request;

    const newTodo = {
      id: uuidv4(),
      title,
      deadline: new Date(deadline),
      done: false,
      created_at: new Date(),
    };

    user.todos.push(newTodo);

    return response.status(201).json(newTodo);
  }
);

app.put("/todos/:id", checksTodoExists, (request, response) => {
  const { title, deadline } = request.body;
  const { todo } = request;

  todo.title = title;
  todo.deadline = new Date(deadline);

  return response.json(todo);
});

app.patch("/todos/:id/done", checksTodoExists, (request, response) => {
  const { todo } = request;

  todo.done = true;

  return response.json(todo);
});

app.delete(
  "/todos/:id",
  checksExistsUserAccount,
  checksTodoExists,
  (request, response) => {
    const { user, todo } = request;

    const todoIndex = user.todos.indexOf(todo);

    if (todoIndex === -1) {
      return response.status(404).json({ error: "Todo not found" });
    }

    user.todos.splice(todoIndex, 1);

    return response.status(204).send();
  }
);

module.exports = {
  app,
  users,
  checksExistsUserAccount,
  checksCreateTodosUserAvailability,
  checksTodoExists,
  findUserById,
};
