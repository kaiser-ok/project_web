以下是一份 最新整合版、可直接給工程師或 AI 開發的完整 Use Case 文件（含設備、消耗品、交通費等成本功能）。
已完整整合你所有需求，包含：
角色啟用/停用


非人力成本


專案計劃書


進度/工時/財務


專案報告書


組織成員管理


這是一份 正式級別的 Use Case 文檔，可直接作為開發規格書使用。

📘 
專案管理系統 Use Case 文件（完整版 v2.0）

1. 系統簡介（Overview）
本系統是一套 Web 型專案管理平台，提供使用者：
建立與管理專案（Project）


管理專案成員與角色（PM / PPM / PMO / PD / CREW）


編輯專案計劃書（Goal / Approach / Resource / 審查結果）


建立與追蹤任務（Task / WBS）


填報工時與工作內容


管理專案財務（收入、成本）


記錄設備 / 消耗品 / 交通費等非人力成本


管理專案最後報告書（Project Report）


系統管理（成員管理 / 角色啟用停用）


活動紀錄追蹤（Activity Logs）


所有資料皆由 Web 表單輸入（Excel 僅作為需求來源，不提供給使用者匯入）。

2. 系統角色（Actors）
Actor
說明
User（一般使用者）
可登入、參與專案、填工時
Project Member
加入某專案後被指派角色 (PM/PPM/PMO/PD/CREW)
PM
專案經理，具完整編輯權限
PPM / PMO / PD
專案審查、管理協作角色
CREW
一般執行者，只能看任務並填工時
Admin
系統管理者，管理組織成員與專案角色啟用/停用
Google OAuth Provider
身分認證來源


3. 系統功能架構（Functional Overview）
Dashboard（我的專案、我的任務）


專案管理


計劃書（基本資訊 / Goal / Approach / Resource / 審查結果）


專案成員管理


任務（WBS）


工時


成本（設備、耗材、交通費…）


財務（收入 / 成本 / 損益）


專案報告書


活動紀錄


系統管理


組織成員管理（Users）


角色啟用/停用（Roles）



4. 完整 Use Case（UC-01 ～ UC-15）

UC-01 使用者登入（Google OAuth）
主要角色：User
描述：使用 Google 登入後，系統建立/更新使用者紀錄。
前置條件：
User 擁有 Google 帳號





UC-02 使用者 Dashboard（專案與任務總覽）
角色：User
描述：顯示使用者所參與的專案與被指派的 task。

UC-03 建立新專案（Web 表單）
角色：PM
描述：透過 Web 表單建立專案基本資料與部分 Goal 內容。
資料內容包含：


專案名稱


概要


類型（客需、策略、內部）


專案期間


初步收入 / 支出預估（可空）



UC-04 維護專案計劃書（Goal / Approach / Resource / 審查）
角色：PM / PPM / PMO / PD
內容包含：
A. 計劃書主要欄位
基本資訊


Goal（藍色區）：


專案價值


客戶滿意度


收入、支出、損益、利潤率


專案期間


Approach（綠色區）


Resource（紫色區）：人力投入（角色/人名/時薪）、能力提升、知識累積


B. 專案審查結果
審查狀態（核准、有條件核准、駁回、待審）


審查日期、審查者、備註



UC-05 管理專案成員與角色
角色：PM / PPM / PMO
功能：
新增成員（User → ProjectMembers）


指派角色（依啟用中的 Roles 顯示）


調整角色


移除成員


發送通知



UC-06 成員接受 / 拒絕專案邀請
角色：被邀請 User
描述：使用者選擇接受或拒絕加入某專案。

UC-07 建立與維護任務（Task / WBS）
角色：PM / 管理角色
功能：
新增 / 編輯 / 刪除 Task


欄位包含：


WBS 編號


任務名稱


負責人


角色（可選）


日期（開始 / 結束）


預估工時


狀態（未開始 / 進行中 / 完成）



UC-08 填報工時與工作紀錄
角色：所有 Project Member
功能：
選擇 Task


填寫：日期、工時、紀錄內容


存入 ProjectWorkHours


用於計算人力成本



UC-09 管理專案財務（月度收支總覽）
角色：PM / PD / PPM / PMO
財務欄位
收入


人力成本（由工時 × 時薪計算）


非人力成本（由 ProjectCostItems 彙總）

總成本
損益（收入 - 成本）
利潤率


功能：
PM 可以手動編輯收入、成本
甘特圖下方銜接其他表格(工時管理表、收支管理表)，月份與甘特圖切齊
重新計算成本（按鈕觸發 or 自動）
顯示每月摘要



UC-10 專案管理表（進度 / WBS / 月成本顯示）
角色：所有專案成員
內容顯示：
所有任務進度

預估 vs 實際工時
月成本分析：
人力
非人力費用：設備、消耗品、交通費、其他


可用圖表呈現（甘特圖 / 長條圖 / 折線圖）

UC-11 管理專案報告書（結案報告）
角色（編輯）：PM / PD
角色（檢視）：所有成員
內容包含：
專案背景


KPI 達成度


重要成果


財務結算（收入、成本、損益）


經驗與知識累積



UC-12 管理組織成員（Admin）
角色：Admin
功能：
新增使用者


編輯使用者（姓名、alias）


停用使用者


影響可被指派為專案成員的清單



UC-13 活動紀錄（Activity Logs）
角色：系統（寫入）、管理者（檢視）
內容：
操作人


操作時間


操作類型（CREATE / UPDATE / DELETE）


目標物件（Project / Task / Member / Finance / Cost…）


摘要


舊值/新值（可選）



UC-14 專案角色啟用 / 停用（Admin）
角色：Admin
描述：
控制系統可用的專案角色（PM / PPM / PMO / PD / CREW）。


停用後無法用於新增專案成員或 Task，但歷史資料保留。


欄位：
Roles(code, name, is_active)


功能：
勾選啟用 / 停用


儲存


更新 DB


寫入 ActivityLogs



UC-15 管理專案非人力成本（設備 / 消耗品 / 交通費等）
角色：PM / PD / PPM / PMO
用途：記錄所有非人力成本，並彙總至財務報表。
A. 業務範圍
記錄以下開銷：
設備（設備採購、維修）


消耗品（文具、材料…）


交通費（高鐵、計程車、住宿）


其他專案直接成本


B. 欄位（ProjectCostItems）
欄位
說明
date
成本發生日
month
對應月份（自動帶出）
category
EQUIPMENT / CONSUMABLE / TRAVEL / OTHER
amount
金額
description
說明
vendor
供應商（選填）
invoice_no
單據編號（選填）
created_by
使用者

C. 功能流程
使用者進入「成本管理」頁面


查看成本列表（含分類）


可新增：


填寫日期、類別、金額、說明（必要）、供應商、單據編號


可編輯既有成本


可刪除（或標記為刪除）


系統即時（或按鈕觸發）更新對應月份的財務彙總（ProjectFinances.other_cost）


系統寫入 ActivityLogs



5. Use Case 一覽表（Summary）
編號
Use Case
UC-01
使用者登入（Google OAuth）
UC-02
Dashboard：我的專案與任務
UC-03
建立專案
UC-04
維護專案計劃書（含審查結果）
UC-05
管理專案成員與角色
UC-06
接受／拒絕專案邀請
UC-07
建立與維護任務（WBS）
UC-08
填報工時
UC-09
管理專案財務（月度收支總覽）
UC-10
專案管理表（進度＋成本分析）
UC-11
管理專案報告書
UC-12
管理組織成員（Admin）
UC-13
活動紀錄（Activity Logs）
UC-14
專案角色啟用／停用（Admin）
UC-15
管理非人力成本（設備、耗材、交通費）





