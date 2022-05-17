import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({
    productId,
    amount,
  }: UpdateProductAmount) => Promise<void>;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

const localStorageKey = "@RocketShoes:cart";

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem(localStorageKey);

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const hasProduct = cart.find((product) => product.id === productId);

      if (hasProduct) {
        await updateProductAmount({ productId, amount: hasProduct.amount + 1 });
        return;
      }

      const { data: product } = await api.get<Product>(
        `/products/${productId}`
      );

      let cloneCart = [...cart];
      cloneCart.push({ ...product, amount: 1 });

      setCart([...cloneCart]);
      localStorage.setItem(localStorageKey, JSON.stringify(cloneCart));
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productIndex = cart.findIndex(
        (product) => product.id === productId
      );

      if (productIndex < 0) throw new Error();

      let cloneCart = [...cart];

      cloneCart.splice(productIndex, 1);

      setCart([...cloneCart]);
      localStorage.setItem(localStorageKey, JSON.stringify(cloneCart));
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const { data: stock } = await api.get<Stock>(`/stock/${productId}`);

      if (amount > stock.amount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      const productIndex = cart.findIndex(
        (product) => product.id === productId
      );

      let cloneCart = [...cart];

      cloneCart[productIndex].amount = amount;

      setCart([...cloneCart]);
      localStorage.setItem(localStorageKey, JSON.stringify(cloneCart));
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
