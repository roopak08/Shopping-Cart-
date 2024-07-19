const API = (() => {
  const URL = "http://localhost:3000";
  const getCart = () => {
    // define your method to get cart data
    return fetch(`${URL}/cart`).then((res) => res.json());
  };

  const getInventory = () => {
    // define your method to get inventory data
    return fetch(`${URL}/inventory`).then((res) => res.json());
  };

  const addToCart = (inventoryItem) => {
    // define your method to add an item to cart
    return fetch(`${URL}/cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(inventoryItem),
    }).then((res) => res.json());
  };

  const updateCart = (id, newAmount) => {
    // define your method to update an item in cart
    return fetch(`${URL}/cart/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: newAmount}),
    }).then((res) => res.json());
  };

  const deleteFromCart = (id) => {
    // define your method to delete an item in cart
    return fetch(`${URL}/cart/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    }).then((res) => res.json());
  };

  const checkout = () => {
    // you don't need to add anything here
    return getCart().then((data) =>
      Promise.all(data.map((item) => deleteFromCart(item.id)))
    );
  };

  return {
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  };
})();

const Model = (() => {
  // implement your logic for Model
  class State {
    #onChange;
    #inventory;
    #cart;
    constructor() {
      this.#inventory = [];
      this.#cart = [];
    }
    get cart() {
      return this.#cart;
    }

    get inventory() {
      return this.#inventory;
    }

    set cart(newCart) {
      this.#cart = newCart;
      if (this.#onChange) {
        this.#onChange();
      }
    }
    set inventory(newInventory) {
      this.#inventory = newInventory;
      if (this.#onChange) {
        this.#onChange();
      }
    }

    subscribe(cb) {
      this.#onChange = cb;
    }
  }
  const {
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  } = API;
  return {
    State,
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  };
})();

const View = (() => {
  // implement your logic for View
  const inventoryContainer = document.querySelector(".inventory-container ul");
  const cartContainer = document.querySelector(".cart-container ul");
  const checkoutBtn = document.querySelector(".checkout-btn");

  const renderInventory = (inventory) => {
    inventoryContainer.innerHTML = inventory
      .map((item) => `
        <li data-id="${item.id}">
          ${item.content}
          <button class="minus-btn">-</button>
          <input type="text" disabled value="1">
          <button class="plus-btn">+</button>
          <button class="add-btn">add to cart</button>
        </li>
      `)
      .join("");
  };

  const renderCart = (cart) => {
    cartContainer.innerHTML = cart
      .map((item) => `
        <li data-id="${item.id}">
          ${item.content} x ${item.amount}
          <button class="delete-btn">delete</button>
        </li>
      `)
      .join("");
  };

  return {
    renderInventory,
    renderCart,
    inventoryContainer,
    cartContainer,
    checkoutBtn,
  };
})();

const Controller = ((model, view) => {
  // implement your logic for Controller

  const state = new model.State();

  const init = () => {

    model.getInventory().then((inventory) => {
      state.inventory = inventory;
    });
    model.getCart().then((cart) => {
      state.cart = cart;
    });
  };
  const handleUpdateAmount = (e) => {
    const parent = e.target.parentElement; 
  const input = parent.querySelector("input"); 
  let currentAmount = parseInt(input.value);

  if (e.target.classList.contains("minus-btn")) {
    currentAmount = Math.max(1, currentAmount - 1); 
  } else if (e.target.classList.contains("plus-btn")) {
    currentAmount += 1;
  }

  input.value = currentAmount;
  };

  const handleAddToCart = (e) => {

    if (e.target.classList.contains("add-btn")) {
      const parent = e.target.parentElement;
      const id = parseInt(parent.dataset.id);
      const amount = parseInt(parent.querySelector("input").value);
  
      const item = state.inventory.find((item) => item.id === id);
      const cartItem = state.cart.find((item) => item.id === id);
  
      if (cartItem) {
        model.updateCart(id, cartItem.amount + amount).then(() => {
          state.cart = state.cart.map((item) =>
            item.id === id ? { ...item, amount: item.amount + amount } : item
          );
        });
      } else {
        model.addToCart({ ...item, amount }).then((newItem) => {
          state.cart = [...state.cart, newItem];
        });
      }
    }
  };

  const handleDelete = (e) => {
    if (e.target.classList.contains("delete-btn")) {
      const parent = e.target.parentElement;
      const id = parseInt(parent.dataset.id);
      console.log(`Deleting item with ID: ${id}`);
      model.deleteFromCart(id).then(() => {
        console.log(`Item with ID ${id} deleted from backend`); 
        state.cart = state.cart.filter((item) => item.id !== id); 
        console.log(`State updated, current cart:`, state.cart);
  
        view.renderCart(state.cart);
      }).catch((error) => {
        console.error(`Failed to delete item with ID ${id}:`, error);
      });
    }
  };

  const handleCheckout = () => {
    model.checkout().then(() => {
      state.cart = [];
    });
  };
  const initEventListeners = () => {
    // Inventory container event listeners
    view.inventoryContainer.addEventListener('click', (e) => {
      if (e.target.classList.contains('minus-btn') || e.target.classList.contains('plus-btn')) {
        handleUpdateAmount(e);
      }
      if (e.target.classList.contains('add-btn')) {
        handleAddToCart(e);
      }
    });
  
    // Cart container event listener
    view.cartContainer.addEventListener('click', (e) => {
      if (e.target.classList.contains('delete-btn')) {
        handleDelete(e);
      }
    });
  
    // Checkout button event listener
    view.checkoutBtn.addEventListener('click', () => {
      handleCheckout();
    });
  };
  const bootstrap = () => {
    init();

    state.subscribe(() => {
      view.renderInventory(state.inventory);
      view.renderCart(state.cart);
    });

    

    initEventListeners();
  };
  return {
    bootstrap,
  };
})(Model, View);

Controller.bootstrap();
