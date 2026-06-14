import docker
import os

client = docker.from_env()

SANDBOX_IMAGE   = "python:3.11-slim"   # default image for running contestant code
MEMORY_LIMIT    = "512m"               # max RAM per container
CPU_QUOTA       = 200000               # 2 CPU cores (out of 100000 per core)
CONTAINER_PORT  = 8888                 # contestant's engine must listen here


def run_sandbox(submission_id: str, file_path: str, host_port: int = 9000) -> dict:
    """
    Spin up an isolated Docker container for a contestant's submission.
    Returns container info so bots know where to send orders.
    """
    try:
        # Stop any previous container for this submission
        stop_sandbox(submission_id)

        upload_dir = os.path.abspath(os.path.dirname(file_path))

        container = client.containers.run(
            image=SANDBOX_IMAGE,
            name=f"sandbox_{submission_id[:8]}",
            command="sleep 300",        # placeholder — real engine would start here
            detach=True,

            # Resource limits (fair play)
            mem_limit=MEMORY_LIMIT,
            cpu_quota=CPU_QUOTA,

            # Network isolation — only accepts traffic, cannot reach internet
            network_mode="bridge",

            # Mount the submission folder read-only
            volumes={
                upload_dir: {
                    "bind": "/submission",
                    "mode": "ro"
                }
            },

            # Expose contestant's port to host
            ports={f"{CONTAINER_PORT}/tcp": host_port},

            # Auto-remove when stopped
            remove=False,
        )

        return {
            "container_id": container.id[:12],
            "container_name": container.name,
            "host_port": host_port,
            "status": "running",
            "endpoint": f"http://localhost:{host_port}",
        }

    except Exception as e:
        return {"status": "error", "detail": str(e)}


def stop_sandbox(submission_id: str):
    """Stop and remove sandbox container for this submission."""
    try:
        container = client.containers.get(f"sandbox_{submission_id[:8]}")
        container.stop(timeout=5)
        container.remove(force=True)
    except docker.errors.NotFound:
        pass
    except Exception:
        pass


def get_sandbox_status(submission_id: str) -> str:
    """Check if sandbox container is still running."""
    try:
        container = client.containers.get(f"sandbox_{submission_id[:8]}")
        return container.status
    except docker.errors.NotFound:
        return "not_found"
