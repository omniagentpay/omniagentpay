import asyncio
import json
import logging
import os
import sys
import traceback
from decimal import Decimal
from typing import Any, Dict

from omniagentpay import OmniAgentPay, PaymentStatus

# Robustly capture and redirect stdout using OS file descriptors
# This ensures even C-libraries or subprocesses writing to FD 1 go to stderr
real_stdout_fd = os.dup(sys.stdout.fileno())
REAL_STDOUT = os.fdopen(real_stdout_fd, 'w')
os.dup2(sys.stderr.fileno(), sys.stdout.fileno())

# Configure logging to stderr
logging.basicConfig(stream=sys.stderr, level=logging.INFO)
logger = logging.getLogger("omniagentpay-server")


class JSONEncoder(json.JSONEncoder):
    """Custom encoder to handle Decimal and sets."""

    def default(self, obj):
        if isinstance(obj, Decimal):
            return str(obj)
        if isinstance(obj, set):
            return list(obj)
        if hasattr(obj, "to_dict"):
            return obj.to_dict()
        if hasattr(obj, "value"):  # Enum support
            return obj.value
        return super().default(obj)


class AgentServer:
    def __init__(self):
        self.client = OmniAgentPay()

    async def handle_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        method = request.get("method")
        params = request.get("params", {})
        req_id = request.get("id")

        try:
            result = await self.dispatch(method, params)
            return {"jsonrpc": "2.0", "result": result, "id": req_id}
        except Exception as e:
            logger.error(f"Error handling request: {e}")
            traceback.print_exc(file=sys.stderr)
            return {
                "jsonrpc": "2.0",
                "error": {"code": -32603, "message": str(e), "data": traceback.format_exc()},
                "id": req_id,
            }

    async def dispatch(self, method: str, params: Dict[str, Any]) -> Any:
        logger.info(f"Method: {method}")

        # ==================== Payment Methods ====================
        if method == "pay":
            if "amount" in params:
                params["amount"] = Decimal(str(params["amount"]))
            result = await self.client.pay(**params)
            return self._serialize_payment_result(result)

        elif method == "simulate":
            if "amount" in params:
                params["amount"] = Decimal(str(params["amount"]))
            result = await self.client.simulate(**params)
            return {
                "would_succeed": result.would_succeed,
                "route": result.route.value if result.route else None,
                "reason": result.reason,
                "estimated_fee": str(result.estimated_fee) if result.estimated_fee else None,
            }

        elif method == "can_pay":
            return self.client.can_pay(**params)

        elif method == "detect_method":
            result = self.client.detect_method(**params)
            return result.value if result else None

        elif method == "batch_pay":
            # Convert amounts in requests
            requests = params.get("requests", [])
            from omniagentpay.core.types import PaymentRequest
            typed_requests = []
            for req in requests:
                if "amount" in req:
                    req["amount"] = Decimal(str(req["amount"]))
                typed_requests.append(PaymentRequest(**req))
            result = await self.client.batch_pay(typed_requests, params.get("concurrency", 5))
            return {
                "total": result.total,
                "succeeded": result.succeeded,
                "failed": result.failed,
                "results": [self._serialize_payment_result(r) for r in result.results],
            }

        # ==================== Wallet Methods ====================
        elif method == "get_balance":
            balance = await self.client.get_balance(**params)
            return str(balance)

        elif method == "create_wallet":
            wallet = await self.client.create_wallet(**params)
            return self._serialize_wallet(wallet)

        elif method == "create_wallet_set":
            wallet_set = await self.client.create_wallet_set(**params)
            return self._serialize_wallet_set(wallet_set)

        elif method == "list_wallets":
            wallets = await self.client.list_wallets(**params)
            return [self._serialize_wallet(w) for w in wallets]

        elif method == "list_wallet_sets":
            sets = await self.client.list_wallet_sets()
            return [self._serialize_wallet_set(s) for s in sets]

        elif method == "get_wallet":
            wallet = await self.client.get_wallet(**params)
            return self._serialize_wallet(wallet)

        elif method == "list_transactions":
            txs = await self.client.list_transactions(**params)
            return [self._serialize_transaction(tx) for tx in txs]

        # ==================== Payment Intents ====================
        elif method == "create_payment_intent":
            if "amount" in params:
                params["amount"] = Decimal(str(params["amount"]))
            intent = await self.client.create_payment_intent(**params)
            return self._serialize_intent(intent)

        elif method == "confirm_payment_intent":
            result = await self.client.confirm_payment_intent(**params)
            return self._serialize_payment_result(result)

        elif method == "get_payment_intent":
            intent = await self.client.get_payment_intent(**params)
            return self._serialize_intent(intent) if intent else None

        elif method == "cancel_payment_intent":
            intent = await self.client.cancel_payment_intent(**params)
            return self._serialize_intent(intent)

        # ==================== Guard Methods ====================
        elif method == "add_budget_guard":
            for key in ["daily_limit", "hourly_limit", "total_limit"]:
                if key in params and params[key] is not None:
                    params[key] = Decimal(str(params[key]))
            await self.client.add_budget_guard(**params)
            return {"success": True}

        elif method == "add_budget_guard_for_set":
            for key in ["daily_limit", "hourly_limit", "total_limit"]:
                if key in params and params[key] is not None:
                    params[key] = Decimal(str(params[key]))
            await self.client.add_budget_guard_for_set(**params)
            return {"success": True}

        elif method == "add_single_tx_guard":
            for key in ["max_amount", "min_amount"]:
                if key in params and params[key] is not None:
                    params[key] = Decimal(str(params[key]))
            await self.client.add_single_tx_guard(**params)
            return {"success": True}

        elif method == "add_recipient_guard":
            await self.client.add_recipient_guard(**params)
            return {"success": True}

        elif method == "add_rate_limit_guard":
            await self.client.add_rate_limit_guard(**params)
            return {"success": True}

        elif method == "add_confirm_guard":
            if "threshold" in params and params["threshold"] is not None:
                params["threshold"] = Decimal(str(params["threshold"]))
            await self.client.add_confirm_guard(**params)
            return {"success": True}

        elif method == "add_confirm_guard_for_set":
            if "threshold" in params and params["threshold"] is not None:
                params["threshold"] = Decimal(str(params["threshold"]))
            await self.client.add_confirm_guard_for_set(**params)
            return {"success": True}

        elif method == "add_rate_limit_guard_for_set":
            await self.client.add_rate_limit_guard_for_set(**params)
            return {"success": True}

        elif method == "add_recipient_guard_for_set":
            await self.client.add_recipient_guard_for_set(**params)
            return {"success": True}

        elif method == "add_single_tx_guard_for_set":
            # Note: This guard applies to all wallets in the set
            from omniagentpay.guards.single_tx import SingleTxGuard
            max_amount = Decimal(str(params.get("max_amount", "1000000")))
            min_amount = Decimal(str(params.get("min_amount", "0"))) if params.get("min_amount") else None
            name = params.get("name", "single_tx")
            guard = SingleTxGuard(max_amount=max_amount, min_amount=min_amount, name=name)
            await self.client.guards.add_guard_for_set(params["wallet_set_id"], guard)
            return {"success": True}

        elif method == "list_guards":
            guards = await self.client.list_guards(**params)
            return guards

        elif method == "list_guards_for_set":
            guards = await self.client.list_guards_for_set(**params)
            return guards

        # ==================== Ledger Methods ====================
        elif method == "sync_transaction":
            entry = await self.client.sync_transaction(**params)
            return self._serialize_ledger_entry(entry)

        # ==================== Health ====================
        elif method == "health":
            return {"status": "ok", "version": "0.0.1"}

        else:
            raise ValueError(f"Unknown method: {method}")

    # ==================== Serialization Helpers ====================
    def _serialize_payment_result(self, result) -> Dict[str, Any]:
        return {
            "success": result.success,
            "transaction_id": result.transaction_id,
            "blockchain_tx": result.blockchain_tx,
            "amount": str(result.amount) if result.amount else None,
            "recipient": result.recipient,
            "method": result.method.value if result.method else None,
            "status": result.status.value if result.status else None,
            "error": result.error,
            "guards_passed": result.guards_passed if hasattr(result, "guards_passed") else [],
            "metadata": result.metadata if hasattr(result, "metadata") else {},
        }

    def _serialize_wallet(self, wallet) -> Dict[str, Any]:
        return {
            "id": wallet.id,
            "address": wallet.address,
            "blockchain": wallet.blockchain.value if hasattr(wallet.blockchain, "value") else str(wallet.blockchain),
            "state": wallet.state.value if hasattr(wallet.state, "value") else str(wallet.state),
            "wallet_set_id": wallet.wallet_set_id,
            "custody_type": wallet.custody_type.value if hasattr(wallet.custody_type, "value") else str(wallet.custody_type),
            "account_type": wallet.account_type.value if hasattr(wallet.account_type, "value") else str(wallet.account_type),
            "update_date": wallet.update_date.isoformat() if wallet.update_date else None,
            "create_date": wallet.create_date.isoformat() if wallet.create_date else None,
        }

    def _serialize_wallet_set(self, ws) -> Dict[str, Any]:
        return {
            "id": ws.id,
            "name": ws.name,
            "custody_type": ws.custody_type.value if hasattr(ws.custody_type, "value") else str(ws.custody_type),
            "update_date": ws.update_date.isoformat() if ws.update_date else None,
            "create_date": ws.create_date.isoformat() if ws.create_date else None,
        }

    def _serialize_transaction(self, tx) -> Dict[str, Any]:
        return {
            "id": tx.id,
            "state": tx.state.value if hasattr(tx.state, "value") else str(tx.state),
            "tx_hash": tx.tx_hash,
            "amounts": [str(a) for a in tx.amounts] if tx.amounts else [],
            "source_address": tx.source_address,
            "destination_address": tx.destination_address,
            "blockchain": tx.blockchain.value if hasattr(tx.blockchain, "value") else str(tx.blockchain),
            "fee_level": tx.fee_level.value if tx.fee_level and hasattr(tx.fee_level, "value") else None,
            "create_date": tx.create_date.isoformat() if tx.create_date else None,
            "update_date": tx.update_date.isoformat() if tx.update_date else None,
        }

    def _serialize_intent(self, intent) -> Dict[str, Any]:
        return {
            "id": intent.id,
            "wallet_id": intent.wallet_id,
            "recipient": intent.recipient,
            "amount": str(intent.amount),
            "status": intent.status.value if hasattr(intent.status, "value") else str(intent.status),
            "metadata": intent.metadata,
            "created_at": intent.created_at.isoformat() if intent.created_at else None,
            "updated_at": intent.updated_at.isoformat() if intent.updated_at else None,
        }

    def _serialize_ledger_entry(self, entry) -> Dict[str, Any]:
        return {
            "id": entry.id,
            "wallet_id": entry.wallet_id,
            "recipient": entry.recipient,
            "amount": str(entry.amount),
            "status": entry.status.value if hasattr(entry.status, "value") else str(entry.status),
            "tx_hash": entry.tx_hash,
            "purpose": entry.purpose,
            "metadata": entry.metadata,
            "created_at": entry.created_at.isoformat() if entry.created_at else None,
            "updated_at": entry.updated_at.isoformat() if entry.updated_at else None,
        }

    async def run(self):
        logger.info("OmniAgentPay Sidecar Server Started")
        
        # Read line by line from stdin
        # This is a synchronous blocking read in a loop, but handled effectively for CLI
        # For high concurrency, we might want a proper async reader, but stdin is usually fine here.
        while True:
            try:
                line = await asyncio.to_thread(sys.stdin.readline)
                if not line:
                    break
                
                line = line.strip()
                if not line:
                    continue

                request = json.loads(line)
                response = await self.handle_request(request)
                
                # Write response to real stdout (single line JSON)
                REAL_STDOUT.write(json.dumps(response, cls=JSONEncoder) + "\n")
                REAL_STDOUT.flush()
                
            except json.JSONDecodeError:
                error_resp = {
                    "jsonrpc": "2.0",
                    "error": {"code": -32700, "message": "Parse error"},
                    "id": None
                }
                REAL_STDOUT.write(json.dumps(error_resp) + "\n")
                REAL_STDOUT.flush()
            except Exception as e:
                logger.critical(f"Fatal loop error: {e}")
                break

if __name__ == "__main__":
    server = AgentServer()
    try:
        asyncio.run(server.run())
    except KeyboardInterrupt:
        pass
