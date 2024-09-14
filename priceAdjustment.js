// ==UserScript==
// @name         调价默认不同意线上版本
// @namespace    http://tampermonkey.net/
// @version      2024-06-07
// @description  try to take over the world!
// @author       You
// @match        https://seller.kuajingmaihuo.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=kuajingmaihuo.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    // 已经自动设置一轮不同意之后，就不再自动勾选了
    let abandonAutoClickRadio = false
    function clickRadioInput(radioInput, isFirst) {
        return new Promise(resolve => {
            if(abandonAutoClickRadio) {
                resolve()
            } else {
                radioInput.click()
                if(isFirst) {
                    setTimeout(() => {
                        const confirmModal = document.querySelector('[data-testid="beast-core-portal-main"]')
                        confirmModal?.querySelector('label[data-testid="beast-core-checkbox"]').click()
                        confirmModal?.querySelectorAll('button')[0].click()
                        resolve()
                    }, 200)
                } else {
                    resolve()
                }
            }
        })
    }
    function swapElements(element1, element2, isTr) {
        if(element1 === element2) return
        // 如果价格已经移动到前面了，就不用再执行了
        if(!isTr && element2.innerHTML.indexOf('¥') < 0) return
      // 创建一个临时的容器来存储第一个元素的下一个兄弟元素
      const nextSibling1 = element1.nextElementSibling;
      const nextSibling2 = element2.nextElementSibling;
      // 将第二个元素插入到第一个元素的位置
      element1.parentNode.insertBefore(element2, nextSibling1);
      // 将第一个元素插入到第二个元素原来的位置
      element2.parentNode.insertBefore(element1, nextSibling2);
    }
    function findModals() {
        let allModals = document.querySelectorAll('[data-testid="beast-core-modal-inner"]')
        allModals.forEach(item => {
            if(!item.selfTag) {
                if(item.querySelector('.MDL_header_5-111-0')?.innerHTML?.indexOf('降价提醒') >= 0) {
                    // regular price reduction
                    item.selfTag = true
                    item.type = 1
                    findPriceReduction(item)
                } else if(item.querySelector('[class^="modal-content_headerLeft"]')?.innerHTML?.indexOf('降价') >= 0){
                    // activity price resuction
                    item.selfTag = true
                    item.type = 2
                    findPriceReduction(item)
                }
            }
        })
        setTimeout(() => {
            findModals()
        }, 2000)
    }
    function doubleCheck(priceReductionModal) {
        const newTrLines = priceReductionModal.querySelector('tbody').querySelectorAll('tr')
        if(priceReductionModal.type === 1) {
            if(parseInt(priceReductionModal.querySelector('[class^="MDL_footer"]').innerHTML.match(/已选择接受.*条，/)[0].match(/[0-9]+/)) === 0) {
                abandonAutoClickRadio = true
            }
            findPriceReduction(priceReductionModal)
        }
    }
    function swapElementsGroups(item, isTr) {
        swapElements(item[2], item[6], isTr)
        swapElements(item[3], item[7], isTr)
    }
    async function findPriceReduction(priceReductionModal) {
        let swap1 = priceReductionModal.type === 1 ? 6 : 0
        let swap2 = priceReductionModal.type === 1 ? 7 : 0
        if(!priceReductionModal) {
            setTimeout(() => {
                findPriceReduction()
            }, 2000)
            return
        }
        let ths = priceReductionModal.querySelector('thead').querySelectorAll('th')
        if(!priceReductionModal.hasChangeThs) {
            swapElementsGroups(ths, true)
            priceReductionModal.hasChangeThs = true
        }
        const trLines = priceReductionModal.querySelector('tbody').querySelectorAll('tr')
        let tds
        let radioInput
        if(trLines && trLines.length > 0) {
            let firstTds = trLines[0].querySelectorAll('td')
            let firstRadioInput = firstTds[firstTds.length - 1].querySelectorAll('label')[1]
            swapElementsGroups(firstTds, false)
            if(firstRadioInput.getAttribute('data-checked') === 'false') {
                await clickRadioInput(firstRadioInput, true)
            }
            if(trLines.length > 1) {
                trLines.forEach((trItem, index) => {
                    if(index > 0) {
                        tds = trItem.querySelectorAll('td')
                        radioInput = tds[tds.length-1].querySelectorAll('label')[1]
                        swapElementsGroups(tds, false)
                        if(radioInput.getAttribute('data-checked') === 'false') {
                            clickRadioInput(radioInput, false)
                        }
                    }
                })
            }
            setTimeout(() => {
                doubleCheck(priceReductionModal)
            }, 300)
        } else {
            // if modal showed without real table data, wait 500ms to exec again
            setTimeout(() => {
                findPriceReduction(priceReductionModal)
            }, 500)
        }
    }

    findModals()
})();
