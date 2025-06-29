import React from "react";
import './CartBtn.css';

export const CartBtn = ({ count = 0, onClick }) => {
    return (
        <div className="cart-btn" onClick={onClick} style={{ position: 'relative', cursor: 'pointer' }}>
            {/* SVG do carrinho estilizado */}
            <svg className="shopping-cart-line" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 18C6.44772 18 6 18.4477 6 19C6 19.5523 6.44772 20 7 20C7.55228 20 8 19.5523 8 19C8 18.4477 7.55228 18 7 18Z" stroke="#FFE001" strokeWidth="2"/>
                <path d="M17 18C16.4477 18 16 18.4477 16 19C16 19.5523 16.4477 20 17 20C17.5523 20 18 19.5523 18 19C18 18.4477 17.5523 18 17 18Z" stroke="#FFE001" strokeWidth="2"/>
                <path d="M3 4H5L6.68 15.39C6.7716 16.0492 7.31213 16.5556 7.97619 16.5556H18.5556C19.2197 16.5556 19.7602 16.0492 19.8518 15.39L21 7.5H6" stroke="#FFE001" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {count > 0 && (
                <span style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    background: '#ffe001',
                    color: '#131313',
                    borderRadius: '50%',
                    width: 22,
                    height: 22,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 13,
                    border: '2px solid #131313',
                }}>{count}</span>
            )}
        </div>
    );
};

export default CartBtn; 