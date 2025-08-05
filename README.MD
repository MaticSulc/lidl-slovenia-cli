# 🛒 LIDL Product Stock CLI

A command-line tool for checking the **availability of non-food promotional products** in **Lidl Slovenia** stores.

## ⚠️ Disclaimer

This tool is provided **for educational and non-commercial purposes only**. Use at your own risk. The author is not affiliated with LIDL Slovenija in any way.

Stock data is retrieved from publicly accessible APIs and may not always be accurate or up-to-date. If these APIs are rate-limited, deprecated, or disabled in the future, this tool may stop working.


## 🔎 Overview

On [www.lidl.si](https://www.lidl.si), customers can view stock status of weekly promotional items before visiting a store. This tool simplifies that process.

**How stock availability is displayed on the site:**

- 🟢 **Green** – In stock  
- 🟡 **Yellow** – Almost sold out  
- 🔴 **Red** – Sold out  
- ⚪ **Grey** – No stock info available  

⚠️ **Note:** Stock data is updated on the day of promotion (typically Monday and Thursday) from 08:00 onward.


## 🚀 Features

- Check product availability by pasting a Lidl product URL  
- Support for multiple product variants  
- Filter by **Slovenian postal code**  
- Optionally update the store list (requires API access)


## 📦 Prerequisites

- [Node.js](https://nodejs.org/) v14 or later  
- `npm` (Node Package Manager)  
- (Optional) Azure Maps API credentials to update store list  


## 🔧 Installation

```bash
git clone https://github.com/MaticSulc/lidl-slovenia-cli.git
cd lidl-slovenia-cli
npm install
cp .env.example .env    # Fill in credentials if needed
```

## 🛠️ Environment Variables

Create a `.env` file with the following variables:

| Variable         | Description                                  |
|------------------|----------------------------------------------|
| `MAPS_HOST`      | Azure Maps API base URL                      |
| `MAPS_API_KEY`   | Azure Maps API key                           |
| `LIDL_STOCK_API` | Lidl stock API base URL                      |


## 📘 Usage

Run the CLI:

```bash
npm start
```

You'll be prompted with options:

### Option 1: Check product availability

- Paste the product URL (e.g., from Lidl.si)
- Select variant if applicable
- Filter by postal code (optional)
- See availability across Lidl stores

### Option 2: Update store list

- Fetches the latest store data (requires Azure Maps credentials)
- Saves the list to `stores.json`



## 🧪 Examples

### ✅ Product without variants

```bash
$ npm start
Welcome to LIDL Product Stock CLI!
Please choose an option:
1. Check product availability
2. Update and list LIDL stores
3. Exit
Select an option: 1
Enter the product URL from LIDL website: https://www.lidl.si/p/silvercrest-kitchen-tools-kuhalnik-za-riz/p10084555?pageId=10076286&tabCode=Current_Sales_Week

🔍 Searching for product: SILVERCREST KITCHEN TOOLS Kuhalnik za riž
🔍 Filter by postcode (press Enter to skip): 2000

🔍 Checking stock across stores...
❌ Not in stock at Tržaska cesta, 2000 Maribor
❌ Not in stock at Koroška cesta, 2000 Maribor
❌ Not in stock at Ulica Veljka Vlahovića, 2000 Maribor
❌ Not in stock at Ulica I. Internacionale 35, 2000 Maribor
❌ Not in stock at Ptujska cesta 192, 2000 Maribor
❌ Not in stock at Industrijska ulica 5, 2000 Maribor
❌ Not in stock at Titova cesta 15, 2000 Maribor

✅ Found 0 stores with stock.
```



### ✅ Product with variants

```bash
$ npm start
Welcome to LIDL Product Stock CLI!
Please choose an option:
1. Check product availability
2. Update and list LIDL stores
3. Exit
Select an option: 1
Enter the product URL from LIDL website: https://www.lidl.si/p/livarno-home-drobilnik-ledu/p10084557?pageId=10076286&tabCode=Current_Sales_Week

🔍 Searching for product: LIVARNO HOME Drobilnik ledu

✅ Found 2 variants for this product.
1. LIVARNO HOME Drobilnik ledu (roza) (ID: 10084557002)
2. LIVARNO HOME Drobilnik ledu (zelen) (ID: 10084557001)

👉 Choose a variant number: 2
🔍 Filter by postcode (press Enter to skip): 2000

🔍 Checking stock across stores...
✅ In stock at Tržaska cesta, 2000 Maribor
✅ In stock at Koroška cesta, 2000 Maribor
✅ In stock at Ulica Veljka Vlahovića, 2000 Maribor
✅ In stock at Ulica I. Internacionale 35, 2000 Maribor
✅ In stock at Ptujska cesta 192, 2000 Maribor
✅ In stock at Industrijska ulica 5, 2000 Maribor
✅ In stock at Titova cesta 15, 2000 Maribor

✅ Found 7 stores with stock.
```



## 💡 Future Ideas
- Create a npm package for easy installation
- Improve information display for CLI application
- Add more filtering options
- Allow data export to CSV or JSON
- Refactor code for better maintainability

## 📄 License

MIT License